# AI Security Prompts — RSA SecureShop

This document is organized to match a specific teaching flow, one
vulnerability at a time:

1. **Explain the concept** (use `INSTRUCTOR_GUIDE.md`'s write-up for that
   vulnerability) — what the vulnerability class is, why it happens, what
   OWASP category it falls under.
2. **Show it live** on the `vulnerable` branch — reproduce the exact steps
   in `INSTRUCTOR_GUIDE.md`.
3. **Show the fix** on the `secured` branch — walk the code change, then
   `git diff vulnerable..secured -- <file>`.
4. **Hand it to AI — cold, and in plain language.** Paste the
   **Vulnerability Discovery** prompt below into an AI coding assistant
   pointed at this repo, checked out on the `vulnerable` branch. These
   prompts are deliberately written at a **business/concept level** — no
   file names, no framework terms (middleware, JWT, router, etc.), no
   internal vulnerability IDs, nothing that requires having already looked
   at this codebase. A tester who just learned "broken access control means
   a user can act outside what their role should allow" should be able to
   write something close to this prompt from that understanding alone. The
   teaching point isn't "AI guarantees it finds the exact line every time"
   — sometimes it will ask a clarifying question, or point at the right
   *area* without the exact function on the first pass, and that's fine.
   The point is that a plain-language description of the concept is
   already enough to start a real, useful scan — you don't need to
   understand the code to know what to ask AI to look for. If a prompt
   needs sharpening after the first answer, that's a natural, honest part
   of the demo, not a failure of it.

Each vulnerability section below has four prompts: **Vulnerability
Discovery** (the step-4 prompt above — the one to use live in class),
**Code Understanding** (a follow-up for orienting deeper in the affected
code), **Remediation** (design the smallest correct fix), and **Regression
Testing** (generate the automated proof). Two general-purpose categories —
**Threat Modeling** and **Scanner Analysis** — appear once at the end,
since they apply across vulnerabilities rather than to one specific bug.

Every prompt assumes the AI has access to this repository (as a coding
assistant with file access, not a general chat model) and is scoped to
RSA SecureShop — none of these are written to be pointed at a real system.

---

## V01 — Broken Access Control (IDOR)

**Vulnerability Discovery**
> Review this application for Broken Access Control — specifically, check
> whether a logged-in customer can view or change another customer's data,
> such as their orders, simply by referencing a different ID, without the
> system checking that they actually own that data.

**Code Understanding**
> Trace `GET /api/orders/:orderId` from the Express route
> (`backend/src/routes/orderRoutes.ts`) all the way to the database query in
> `orderController.ts`. List every authentication and authorization decision
> made along the way, and state explicitly, for each one, whether it checks
> *who is asking* (authentication) or *what they're allowed to see*
> (authorization).

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

**Vulnerability Discovery**
> Review this application for Broken Access Control related to user roles —
> check whether a regular customer account can perform actions or see data
> that should be restricted to administrators only.

**Code Understanding**
> Explain the difference between `authenticate` and `requireAdmin` in
> `backend/src/middleware/auth.ts`. For every route file in
> `backend/src/routes/`, list which middleware(s) are applied and in what
> order.

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

**Vulnerability Discovery**
> Review this application for SQL Injection — check whether any
> user-supplied input, such as the product search box, is used to build
> database queries in a way that could let someone change what the query
> returns or break it.

**Code Understanding**
> Explain, in terms a QA engineer without a security background would
> understand, why `pool.query(\`SELECT ... WHERE name ILIKE '%${name}%'\`)`
> is dangerous but `pool.query("SELECT ... WHERE name ILIKE $1", [\`%${name}%\`])`
> is not — even though both eventually put the same user input into the
> same query logically.

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

**Vulnerability Discovery**
> Review this application for Cross-Site Scripting (XSS) — check whether
> content submitted by one user, such as a product review, could contain a
> script that runs in another user's browser when they view it.

**Code Understanding**
> Explain what `dangerouslySetInnerHTML` does differently from normal JSX
> expression interpolation (`{value}`), and why React's own naming
> convention for this prop is a deliberate warning.

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

**Vulnerability Discovery**
> Review this application's login feature for missing protection against
> automated password-guessing — check whether there's any limit on how many
> times someone can attempt to log in.

**Code Understanding**
> Explain what `express-rate-limit` does, what "keyed by IP" means in this
> context, and what a legitimate user would experience versus what an
> attacker running a password-guessing script would experience with a
> 5-attempts-per-minute limit.

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

**Vulnerability Discovery**
> Review this application's login feature for information leakage — check
> whether the message shown after a failed login attempt reveals whether a
> given email address actually has an account, separately from whether the
> password was correct.

**Code Understanding**
> Explain, from an attacker's perspective, what they can learn about a
> system's user base if "unknown email" and "wrong password" return
> different error messages — and why this matters even though neither
> response reveals the password itself.

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

**Vulnerability Discovery**
> Review this application's logout feature — check whether logging out
> actually ends the session on the server, or whether a login credential
> issued before logout could still be used to access the account
> afterward.

**Code Understanding**
> Explain the difference between a JWT's built-in expiry (`JWT_EXPIRES_IN`)
> and server-side session revocation, and why relying on expiry alone is
> insufficient for a working logout feature.

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

**Vulnerability Discovery**
> Review how this application stores user passwords — check whether they
> are stored securely (encrypted/hashed) or in a way that would be
> immediately readable to anyone who got access to the database.

**Code Understanding**
> Explain what `bcrypt.hash` and `bcrypt.compare` actually do, why bcrypt
> specifically (versus, say, plain SHA-256) is the appropriate choice for
> passwords, and what "salt" means in this context.

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

**Vulnerability Discovery**
> Review this application's error handling — check whether an error message
> shown to a user or returned by the API reveals internal technical details
> (like internal file locations, database error messages, or system
> information) that could help an attacker understand how the system is
> built.

**Code Understanding**
> Explain what information an attacker gains from a stack trace, a database
> error code, and a source file path in an HTTP response, and why each of
> those is useful even without a working exploit yet.

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

**Vulnerability Discovery**
> Review this application for any hidden or leftover developer/debug
> features that can be reached without logging in.

**Code Understanding**
> Explain why a debug/diagnostic endpoint that requires no authentication is
> risky even when — like this one — it only returns synthetic, non-secret
> values, thinking about how it changes an attacker's understanding of the
> system's architecture.

**Remediation**
> Recommend two possible fixes: outright removal (what this repo actually
> does) versus restricting the route to admin-only access. Explain a
> situation where each would be the more appropriate choice.

**Regression Testing**
> Generate a test asserting `GET /api/debug/config` returns 404.

---

## V07 — Insecure Design: Checkout Trusts a Client-Supplied Price

**Vulnerability Discovery**
> Review this application's checkout process — check whether the price a
> customer is charged is determined by the server from the actual product
> price, or whether it could instead be influenced by something the
> customer's own request sends.

**Code Understanding**
> Explain why this bug is categorized as "Insecure Design" rather than a
> straightforward input-validation bug — what would a code reviewer need to
> understand about the *business rule* (not just the code) to catch this?

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

**Vulnerability Discovery**
> Check whether this application uses any third-party software libraries
> with known, publicly documented security vulnerabilities.

**Code Understanding**
> Explain the difference between a vulnerability *in code we wrote* and a
> vulnerability *in a dependency we installed*, and why SCA tooling (not
> SAST or manual testing) is the right way to find the latter.

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
