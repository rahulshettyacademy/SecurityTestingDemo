# AI Security Prompts — RSA SecureShop

This document is organized to match a specific teaching flow, one
vulnerability at a time:

1. **Explain the concept** (use `INSTRUCTOR_GUIDE.md`'s write-up for that
   vulnerability).
2. **Show it live** on the `vulnerable` branch — reproduce the exact steps
   in `INSTRUCTOR_GUIDE.md`.
3. **Show the fix** on the `secured` branch — walk the code change, then
   `git diff vulnerable..secured -- <file>`.
4. **Hand it to AI.** Before moving on, paste the **Vulnerability
   Discovery** prompt below for that vulnerability into an AI coding
   assistant pointed at this repo. The point of this step: you (or the
   instructor) already found *one* specific bug by hand. The prompt asks
   the AI to review the same area with fresh eyes — it should surface the
   bug you already found, *and often something adjacent you didn't
   specifically go looking for* (a missing check on a related endpoint, an
   edge case in the fix, a related OWASP category). That's the demonstration:
   manual testing found one thing; AI-assisted review widens the net.

Each vulnerability section below has four prompts: **Code Understanding**
(orient before testing), **Vulnerability Discovery** (the step-4 prompt,
designed to find more than the one scripted example), **Remediation**
(design the smallest correct fix), and **Regression Testing** (generate the
automated proof). Two general-purpose categories — **Threat Modeling** and
**Scanner Analysis** — appear once at the end, since they apply across
vulnerabilities rather than to one specific bug.

Every prompt assumes the AI has access to this repository (as a coding
assistant with file access, not a general chat model) and is scoped to
`RSA SecureShop` — none of these are written to be pointed at a real system.

---

## V01 — Broken Access Control (IDOR)

**Code Understanding**
> Trace `GET /api/orders/:orderId` from the Express route
> (`backend/src/routes/orderRoutes.ts`) all the way to the database query in
> `orderController.ts`. List every authentication and authorization decision
> made along the way, and state explicitly, for each one, whether it checks
> *who is asking* (authentication) or *what they're allowed to see*
> (authorization).

**Vulnerability Discovery**
> I manually found that `GET /api/orders/:orderId` returns another user's
> order with no ownership check. Review the rest of `backend/src/routes/`
> and `backend/src/controllers/` for the same class of bug: any endpoint
> that takes an ID from the URL, request body, or query string and loads a
> row from the database without verifying the requesting user owns that
> row (or has an explicit, role-checked reason to see it). Do not assume
> that because a route requires `authenticate`, it's also correctly
> authorized — those are different checks. List every endpoint you'd flag,
> even if you're not certain, and explain your reasoning for each.

**Remediation**
> Suggest the smallest possible change to `getOrderById` that fixes the
> missing ownership check, without changing the response shape for
> legitimate requests or breaking the admin override. Show the diff.

**Regression Testing**
> Generate a Supertest test proving that one authenticated customer cannot
> load another customer's order by ID, that a customer can still load their
> own order, and that an admin can load any order. Use the existing
> `security-tests/helpers/auth.ts` login helper.

---

## V01B — Broken Access Control (Vertical Privilege Escalation)

**Code Understanding**
> Explain the difference between `authenticate` and `requireAdmin` in
> `backend/src/middleware/auth.ts`. For every route file in
> `backend/src/routes/`, list which middleware(s) are applied and in what
> order.

**Vulnerability Discovery**
> I manually found that `GET /api/admin/users` only requires
> `authenticate`, not `requireAdmin` — any logged-in customer can call it.
> Check every other route under `backend/src/routes/` for the same
> structural mistake: an admin-sounding feature or a sensitive
> data-returning endpoint that's missing a role check it should have. Also
> check whether any route applies `requireAdmin` in a way that could be
> bypassed (e.g., applied to some routes in a router but not others).

**Remediation**
> Write the middleware chain that correctly restores role-based
> authorization on the affected route, and explain why `authenticate` alone
> was insufficient.

**Regression Testing**
> Generate a Supertest test proving a CUSTOMER-role user gets 403 on
> `GET /api/admin/users`, an ADMIN-role user gets 200, and an unauthenticated
> request gets 401 (three distinct failure/success modes, not just one).

---

## V02 — SQL Injection

**Code Understanding**
> Explain, in terms a QA engineer without a security background would
> understand, why `pool.query(\`SELECT ... WHERE name ILIKE '%${name}%'\`)`
> is dangerous but `pool.query("SELECT ... WHERE name ILIKE $1", [\`%${name}%\`])`
> is not — even though both eventually put the same user input into the
> same query logically.

**Vulnerability Discovery**
> I manually found that `GET /api/products/search` builds its SQL query via
> string interpolation. Search the rest of `backend/src/` for every place a
> database query is constructed, and flag any that build SQL as a string
> (template literal or concatenation) using a variable that ultimately comes
> from `req.query`, `req.body`, or `req.params`, rather than using a
> parameterized placeholder. Note that our Semgrep AST-based rule for this
> pattern missed one instance in this exact codebase because the query was
> assigned to a variable before being passed to `.query()` — check whether
> that same indirection exists anywhere else, since a simple text search
> would also miss it.

**Remediation**
> Rewrite the vulnerable query to use a parameterized placeholder instead of
> string interpolation, preserving the existing `ILIKE '%...%'`
> partial-match behavior exactly.

**Regression Testing**
> Generate a Supertest test suite proving that a single quote in the search
> term does not cause a database error, and that a classic tautology/
> comment-injection payload (`' OR '1'='1' -- `) is treated as a literal,
> harmless search string rather than changing the query's results.

---

## V03 — Stored Cross-Site Scripting

**Code Understanding**
> Explain what `dangerouslySetInnerHTML` does differently from normal JSX
> expression interpolation (`{value}`), and why React's own naming
> convention for this prop is a deliberate warning.

**Vulnerability Discovery**
> I manually found that `frontend/src/pages/ProductDetail.tsx` renders
> review comments via `dangerouslySetInnerHTML`. Search the rest of
> `frontend/src/` for any other place where data that originated from the
> backend (i.e., from another user's input, not hardcoded in the frontend)
> is rendered via `dangerouslySetInnerHTML`, `eval`, `new Function(...)`, or
> assigned directly to `.innerHTML` on a DOM node. Also check whether the
> backend does any output encoding on the way out (it shouldn't need to —
> confirm React is the only thing standing between stored data and the
> rendered page, and flag if that assumption is wrong anywhere).

**Remediation**
> Show the one-line change that fixes this, and explain why it's sufficient
> here (no sanitization library needed) versus a hypothetical scenario where
> the product actually needs to support some HTML formatting in reviews (in
> which case, what would you recommend instead?).

**Regression Testing**
> This can't be tested with a backend API test alone, since the backend
> stores the comment unmodified on both branches — the bug is purely in
> rendering. Generate a Playwright test that submits a review containing an
> `<img src=x onerror="...">` payload via the API, opens the product page in
> a real browser, and asserts the payload renders as literal text with no
> dialog firing (register a `page.on('dialog', ...)` handler to safely
> detect and dismiss it rather than letting it hang the test).

---

## V04A — No Login Rate Limiting

**Code Understanding**
> Explain what `express-rate-limit` does, what "keyed by IP" means in this
> context, and what a legitimate user would experience versus what an
> attacker running a password-guessing script would experience with a
> 5-attempts-per-minute limit.

**Vulnerability Discovery**
> I manually found that `POST /api/auth/login` has no rate limiting. Check
> whether `POST /api/auth/register` or `POST /api/password-reset/request`
> have the same gap — both are also unauthenticated, attacker-reachable
> endpoints where unlimited attempts could enable abuse (account
> enumeration via mass registration attempts, or reset-token exhaustion/spam
> respectively). Recommend whether each one needs its own rate limit and why.

**Remediation**
> Design a rate-limiting strategy for `POST /api/auth/login` that blocks
> credential-stuffing attempts without meaningfully affecting a real user
> who mistypes their password two or three times. State your reasoning for
> the specific window and limit you choose.

**Regression Testing**
> Generate a test that makes 6 rapid failed login requests against the same
> account and asserts the first 5 return 401 while the 6th returns 429.

---

## V04B — Username Enumeration

**Code Understanding**
> Explain, from an attacker's perspective, what they can learn about a
> system's user base if "unknown email" and "wrong password" return
> different error messages — and why this matters even though neither
> response reveals the password itself.

**Vulnerability Discovery**
> I manually found that the login endpoint distinguishes "User does not
> exist" from "Incorrect password." Check whether `POST /api/auth/register`
> (the "email already exists" 409 response) or the password-reset flow leak
> the same kind of information through a different channel — for example,
> does the response timing differ measurably between a valid and invalid
> email (a timing side-channel), even if the message text is identical?

**Remediation**
> Rewrite the login handler so both failure cases return the identical
> message and status code, and confirm no other observable difference
> (response time, headers, body structure) remains between the two cases.

**Regression Testing**
> Generate a test that submits a login for a nonexistent email and a login
> for a real email with the wrong password, and asserts both return the
> exact same error message and status code.

---

## V04C — Logout Does Not Invalidate the Token

**Code Understanding**
> Explain the difference between a JWT's built-in expiry (`JWT_EXPIRES_IN`)
> and server-side session revocation, and why relying on expiry alone is
> insufficient for a working logout feature.

**Vulnerability Discovery**
> I manually found that `logout` never writes to the `revoked_tokens`
> table. Check `backend/src/middleware/auth.ts`'s `authenticate` function
> for whether the revocation check itself could be bypassed some other way
> (for example, does it check `revoked_tokens` on *every* protected route,
> or could a route exist that skips the `authenticate` middleware entirely
> while still trusting a token from elsewhere?). Also check whether there's
> any other way a user's session should be invalidated that this app
> doesn't handle — for example, if a user changes their password, should
> their other active sessions be revoked too? Is that currently the case
> here?

**Remediation**
> Show the change that makes `logout` actually revoke the token, and
> explain why checking `revoked_tokens` on every request (rather than, say,
> maintaining a client-side-only "logged out" flag) is the correct place to
> enforce this.

**Regression Testing**
> Generate a test that logs in, confirms the token works on a protected
> endpoint, logs out, then replays the same token against the same endpoint
> and asserts it now fails with 401.

---

## V05 — Plaintext Password Storage

**Code Understanding**
> Explain what `bcrypt.hash` and `bcrypt.compare` actually do, why bcrypt
> specifically (versus, say, plain SHA-256) is the appropriate choice for
> passwords, and what "salt" means in this context.

**Vulnerability Discovery**
> I manually found that `register`, `login`, and `confirmPasswordReset` all
> handle passwords as plaintext. Check the codebase for any other place a
> password (or a comparably sensitive value, like a reset token) is logged,
> stored, or compared insecurely — for example, is the reset token in
> `passwordResetController.ts` stored as-is in the database, and if so, is
> that acceptable (hint: compare its purpose and lifetime to a password) or
> should it also be hashed before storage?

**Remediation**
> Show the changes to `register`, `login`, and `confirmPasswordReset` needed
> to hash on write and compare via `bcrypt.compare`, and explain what should
> happen to `seed.sql`'s existing plaintext values for this to work
> end-to-end.

**Regression Testing**
> Generate a test that registers a new user, connects to the database
> directly, and asserts the stored `password` column matches a bcrypt hash
> pattern (`/^\$2[aby]\$/`) rather than the plaintext value — then confirms
> login still succeeds with the original password.

---

## V06A / V06C — Verbose Error Responses / Development Configuration

**Code Understanding**
> Explain what information an attacker gains from a stack trace, a database
> error code, and a source file path in an HTTP response, and why each of
> those is useful even without a working exploit yet.

**Vulnerability Discovery**
> I manually found that `errorHandler.ts` includes the full error object in
> the response whenever `NODE_ENV !== 'production'`. Check whether any
> individual route handler has its *own* try/catch block that might leak
> similar detail independently of the global error handler (for example,
> does `createOrder`'s catch block in `orderController.ts` ever return a raw
> database error message in its 400 response, rather than the friendly
> validation messages it's designed to return?). Also check whether
> `console.error`/`console.log` calls anywhere in the codebase might log
> sensitive request data (passwords, tokens) that shouldn't be written to
> logs even in development.

**Remediation**
> Show the fix to `errorHandler.ts`, and explain why logging the real error
> server-side (via `console.error`) while never including it in the HTTP
> response is the right split of "useful for debugging" versus "safe to
> expose."

**Regression Testing**
> Generate a test that triggers a genuine, branch-independent server error
> (hint: an out-of-range integer ID causes a real Postgres error regardless
> of any other vulnerability's fix status) and asserts the response body
> contains only the generic message — no `stack`, `name`, or `code` fields.

---

## V06B — Exposed Debug Endpoint

**Code Understanding**
> Explain why a debug/diagnostic endpoint that requires no authentication is
> risky even when — like this one — it only returns synthetic, non-secret
> values, thinking about how it changes an attacker's understanding of the
> system's architecture.

**Vulnerability Discovery**
> I manually found `GET /api/debug/config`, which isn't linked from any
> route the frontend navigates to. Search `backend/src/` for any other route
> that similarly looks like it was added for development/debugging purposes
> and never removed or protected (look for route names containing "debug,"
> "test," "internal," or routes that don't correspond to anything in the
> frontend's navigation).

**Remediation**
> Recommend two possible fixes: outright removal (what this repo actually
> does) versus restricting the route to admin-only access. Explain a
> situation where each would be the more appropriate choice.

**Regression Testing**
> Generate a test asserting `GET /api/debug/config` returns 404.

---

## V07 — Insecure Design: Checkout Trusts a Client-Supplied Price

**Code Understanding**
> Explain why this bug is categorized as "Insecure Design" rather than a
> straightforward input-validation bug — what would a code reviewer need to
> understand about the *business rule* (not just the code) to catch this?

**Vulnerability Discovery**
> I manually found that `createOrder` uses `item.price` from the request
> body when present. Check the rest of the checkout and cart flow for other
> values the client sends that should instead be authoritative from the
> server: does anything trust a client-supplied `total`, discount amount,
> shipping cost, or stock-availability claim? Also check whether the
> quantity field has any upper bound — could a client request an absurdly
> large quantity and cause an integer overflow or a negative-stock state?

**Remediation**
> Show the fix, and explain why "the server still validates the product
> exists and has stock" isn't sufficient on its own — what specifically
> makes trusting the *price* different from trusting the *product ID* or
> *quantity*?

**Regression Testing**
> Generate a test that submits a checkout request with a real product ID
> but a tampered `price` field, and asserts the resulting order's
> `total_amount` matches the product's real database price, not the
> tampered value.

---

## V08 — Vulnerable and Outdated Components (Supply Chain)

**Code Understanding**
> Explain the difference between a vulnerability *in code we wrote* and a
> vulnerability *in a dependency we installed*, and why SCA tooling (not
> SAST or manual testing) is the right way to find the latter.

**Vulnerability Discovery**
> I ran `npm audit` in `labs/supply-chain-demo/` and found lodash 4.17.15
> has several known advisories. Run `npm audit` (or `npm outdated`) in
> `backend/` and `frontend/` and confirm they're actually clean — then check
> whether any *indirect* (transitive) dependency anywhere in the project is
> close to end-of-support or has a newer major version available, even if
> `npm audit` doesn't currently flag it as vulnerable (a clean audit today
> doesn't mean a dependency won't have a new CVE published next month).

**Remediation**
> Given `npm audit`'s suggested fix, explain the difference between
> `npm audit fix` and `npm audit fix --force`, and when you'd want to
> manually pin a version instead of trusting either automatically.

**Regression Testing**
> There's no meaningful Jest assertion for "this dependency is patched" —
> the regression check is re-running `npm install && npm audit` after the
> version bump and confirming a clean report. Explain why an automated
> *code* test wouldn't add value here, in contrast to every other
> vulnerability in this course.

---

## Threat Modeling (general)

> Identify the trust boundaries in the checkout workflow specifically:
> where does data cross from "controlled by the browser/attacker" to
> "trusted by the server"? For each boundary, name what could go wrong if
> the server trusted data from the other side without validation, and check
> whether that specific thing is actually validated in this codebase today.

> For this entire application, list every place user-supplied data ends up
> in one of three sinks: a SQL query, rendered HTML, or a filesystem/shell
> command. For each sink, state what this app currently does (or doesn't
> do) to make that data safe to use there.

## Scanner Analysis (general)

> Here is a Semgrep finding from `.semgrep/rsa-secureshop-rules.yml`:
> [paste the finding]. Explain what pattern it matched, why that pattern is
> risky in general (not just in this specific case), and whether this
> specific instance is a true positive or a false positive — justify your
> answer by looking at the actual code, not just the rule's description.

> Here is a `gitleaks` finding: [paste the finding]. Explain why the default
> gitleaks ruleset didn't catch this until a custom rule was added, and what
> that implies about tuning secret-scanning tools for an organization's own
> naming conventions rather than trusting default rules alone.

> `npm audit` in `labs/supply-chain-demo/` reports several advisories
> against lodash. For a QA engineer with no prior exposure to any of them,
> explain in plain language what "prototype pollution" means, using one of
> the linked advisories as a concrete example.
