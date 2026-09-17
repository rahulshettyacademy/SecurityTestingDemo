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
4. **Hand it to AI — cold.** Paste the **Vulnerability Discovery** prompt
   below into an AI coding assistant pointed at this repo, checked out on
   the `vulnerable` branch. This prompt is written from *concept knowledge
   only* — it never says "I already found X" or names this course's
   internal vulnerability IDs. It describes the vulnerability *class* the
   way a real tester would think about it (e.g., "endpoints that load a
   resource by ID without verifying ownership"), the same understanding you
   just built in step 1, and asks the AI to scan the codebase for it from
   scratch. The teaching point: once a student actually understands a
   vulnerability class, they don't have to manually click through every
   endpoint to find instances of it — a well-grounded prompt can have AI do
   that scan for them. Run it, and confirm together that the AI's answer
   correctly lands on the same file/function you just demonstrated by hand
   in step 2.

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
> Review this Express + PostgreSQL backend for Broken Access Control
> vulnerabilities, specifically Insecure Direct Object Reference (IDOR):
> any endpoint that accepts a resource ID (from the URL, query string, or
> body) and returns or modifies that resource without verifying the
> authenticated caller actually owns it, or has an explicit, checked reason
> to access it. Being logged in (authentication) is not the same as being
> allowed to see this specific resource (authorization) — flag any place
> where only the former is verified. For each finding: name the file,
> function, and exact line; describe the concrete request that would prove
> it (what value to change, and what response difference confirms it); and
> state what check is missing.

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
> Review this Express backend's route definitions for vertical privilege
> escalation: any route whose purpose implies it should be restricted to a
> specific role (e.g., an admin-only feature) but is only protected by a
> general "is this user logged in" check, not a check on *which role* the
> user has. For every router file, list which middleware(s) run before each
> handler and in what order, and flag any route where a role check appears
> to be missing given what the route does. Name the file and line for each
> finding, and describe what request (logged in as which role) would prove
> the gap.

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
> Review this Express + PostgreSQL backend for SQL Injection: any place a
> database query is built by concatenating or interpolating a value into
> the SQL text itself (a template literal or string concatenation)
> rather than passing it as a parameterized placeholder (`$1`, `$2`, ...) in
> a separate values array — where that interpolated value ultimately comes
> from user input (`req.query`, `req.body`, or `req.params`). Check both the
> direct call site and any case where the query string might be assigned to
> a variable before being passed to `.query()`, since that indirection can
> hide the issue from a simple text search. For each finding: name the
> file, function, and line; and give one example input that would prove the
> query's *logic* can be changed, not just cause an error.

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
> Review this React frontend for Cross-Site Scripting sinks: any place data
> that came from another user's input (i.e., arrived via an API response,
> not hardcoded in the component) is rendered using `dangerouslySetInnerHTML`,
> assigned to a DOM node's `.innerHTML`, or otherwise bypasses React's
> default text-escaping. For each finding: name the file and line, identify
> which upstream API field the rendered value comes from, and check whether
> that field is sanitized anywhere before this point (on the frontend or
> the backend) — state clearly if it is not.

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
> Review this Express backend's authentication-related routes (login,
> registration, password reset) for missing rate limiting or brute-force
> protection. For each such route, check whether any throttling, lockout,
> or CAPTCHA-style middleware runs before the handler. For each route
> missing this protection, name the file and line where the route is
> declared, and describe what an attacker could do given unlimited
> attempts, specific to what that particular endpoint does (credential
> stuffing on login is a different risk than reset-token exhaustion on
> password reset — describe each on its own terms, don't just say
> "brute force" for all of them).

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
> Review this Express backend's login and account-related endpoints for
> information disclosure that would let an attacker determine whether a
> specific email address has a registered account, without ever needing to
> guess the correct password. Look specifically at error messages and
> status codes that might differ between "this account doesn't exist" and
> "this account exists but the credential was wrong" across every relevant
> endpoint (login, registration, password reset) — not just login. For each
> finding, name the file, function, and line, and quote the exact differing
> response text.

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
> Review this Express backend's session/token lifecycle: trace what happens
> to a JWT from login through to logout. Specifically check whether the
> logout endpoint actually invalidates the token server-side (e.g., via a
> revocation record checked on subsequent requests), or only relies on the
> client discarding it. Name the file and function for both the logout
> handler and the authentication middleware, and describe a concrete
> request sequence (login, capture the token, log out, replay the same
> token against a protected endpoint) that would prove whether it still
> works after logout.

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
> Review this Express backend's user registration, login, and
> password-reset code for how passwords are stored and compared.
> Specifically check whether a one-way hashing function (like bcrypt) is
> used before writing a password to the database, and whether login
> compares the submitted password against a hash (via a constant-time
> comparison function) rather than a plain string equality check. For each
> finding, name the file, function, and line, and state exactly what you'd
> see if you queried the database's `users` table directly.

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
> Review this Express backend's error-handling middleware and any
> route-level try/catch blocks. Check whether an unhandled exception (e.g.,
> a database error) ever results in the raw error — a stack trace, an error
> code, or the exception message — being included in the HTTP response sent
> to the client, rather than being logged server-side only. Check
> specifically whether this behavior depends on an environment variable
> like `NODE_ENV`, and if so, what that variable's default value is in this
> project's `docker-compose.yml` or `.env.example` (i.e., is verbose output
> actually on by default in how this app normally runs?). Name the file and
> line, and describe a request that would trigger and reveal this.

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
> Review this Express backend's full list of mounted routes (check the main
> app setup file and every router file it imports) for any endpoint that
> looks like it was added for development or debugging purposes rather than
> a real product feature — for example, a route name containing "debug,"
> "test," or "internal," or a route that doesn't correspond to anything
> reachable from the frontend's navigation — and check whether it requires
> authentication. For each finding, name the file and line where the route
> is mounted, and state exactly what information the endpoint returns.

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
> Review this Express backend's checkout/order-creation endpoint for
> business-logic trust issues: does the server use any pricing, discount,
> or total-amount value supplied directly in the request body, instead of
> recalculating it from the product catalog stored in the database? Name
> the file, function, and line, and describe the exact tampered request
> body that would let a caller control what they're charged — and
> explicitly distinguish this from the product ID and quantity fields,
> which the server legitimately does need to trust from the request.

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
> This project has an isolated lab folder (`labs/supply-chain-demo`) with
> its own `package.json`, separate from the main application's
> dependencies. Run `npm audit` inside it, and separately inside `backend/`
> and `frontend/`. Compare the results: which one reports vulnerabilities,
> and what specific package and version is responsible? For the flagged
> package, explain what class of vulnerability the advisories describe,
> without needing to read that package's own source code.

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
