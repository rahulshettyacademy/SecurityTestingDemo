# Instructor Guide — RSA SecureShop

This guide gives full technical detail for every intentional vulnerability in
RSA SecureShop: where it lives, how to reproduce it, why it exists, how it is
fixed on the `secured` branch, and how to verify the fix. It is written for
the instructor — none of this detail is surfaced in the student-facing UI.

All vulnerabilities are scoped to `http://localhost:3000` / `http://localhost:5000`
running locally via Docker Compose. See `SECURITY_WARNING.md` before doing
anything with this application outside that environment.

Each vulnerable code location is marked in the source with a
`SECURITY-LAB-VULNERABILITY:` comment (backend only — the comment is never
surfaced in the customer-facing UI) so students can `grep` for the full list
once they know how.

---

## V01 — Broken Access Control (Horizontal): Insecure Direct Object Reference

1. **Vulnerability ID:** V01
2. **Vulnerability name:** Insecure Direct Object Reference (IDOR) on order lookup
3. **OWASP category:** A01:2021 – Broken Access Control
4. **Feature:** My Orders / Order Details
5. **API endpoint:** `GET /api/orders/:orderId`
6. **Vulnerable code location:** `backend/src/controllers/orderController.ts`, function `getOrderById`
7. **What the normal user does:** Rahul logs in, opens "My Orders," and clicks into order **#1001**, which he owns. The frontend calls `GET /api/orders/1001`.
8. **What the security tester changes:** While logged in as Rahul, change the order id in the URL (or replay the request in Postman/curl/DevTools) to **1002** — an order that belongs to Priya (user id 102).
9. **Expected vulnerable behavior:** The API returns `200 OK` with Priya's full order details (items, total, status) even though the request is authenticated as Rahul, not Priya.
10. **Why the vulnerability exists:** The handler calls `authenticate` (so it correctly rejects anonymous requests) but never compares `order.user_id` to `req.user.userId` before returning the row. Authentication is confused for authorization — a very common real-world mistake.
11. **Secured implementation:** `secured` branch, same file/function. After loading the order, the handler checks `order.user_id !== req.user.userId && req.user.role !== 'ADMIN'` and returns `403 Forbidden` if the requester is neither the owner nor an admin.
12. **How the remediation works:** Ownership is enforced server-side on every request, independent of what the UI shows or hides. An admin override is explicit and role-checked, not implicit.
13. **How to verify the fix:** Log in as Rahul, `GET /api/orders/1002` → expect `403`. `GET /api/orders/1001` (Rahul's own) → expect `200`. Log in as admin, `GET /api/orders/1002` → expect `200` (admin override is intentional, not a bug).
14. **Tools that may detect it:** OWASP ZAP (via authenticated active scan comparing two user sessions) can flag this with its access-control testing add-ons, but reliably catching IDOR is still mostly a **manual/logic** exercise — Burp Suite's Autorize extension or a scripted Postman/Newman collection that replays one user's requests with another user's token is the standard approach.
15. **Best detection approach:** Manual testing (primary) — this is a logic flaw, not a pattern SAST/SCA can see. DAST can assist if configured with two authenticated sessions to diff responses.
16. **Suggested AI prompts:** See `AI_SECURITY_PROMPTS.md`, section "V01".

---

## V01B — Broken Access Control (Vertical): Missing Role Check

1. **Vulnerability ID:** V01B
2. **Vulnerability name:** Vertical privilege escalation via missing role check
3. **OWASP category:** A01:2021 – Broken Access Control
4. **Feature:** Admin User Management
5. **API endpoint:** `GET /api/admin/users`
6. **Vulnerable code location:** `backend/src/routes/adminRoutes.ts`
7. **What the normal user does:** Admin logs in and opens "Admin → User Management" to see the full user list.
8. **What the security tester changes:** Log in as Rahul (role `CUSTOMER`) and call `GET /api/admin/users` directly (the link is not shown in the nav for non-admins, but the API does not know that).
9. **Expected vulnerable behavior:** The API returns `200 OK` with the full user list (id, name, email, role for every user) to a non-admin account.
10. **Why the vulnerability exists:** The route only runs `authenticate` — the `requireAdmin` role-check middleware has been removed from the router chain. The endpoint correctly rejects anonymous callers but does not distinguish CUSTOMER from ADMIN.
11. **Secured implementation:** `secured` branch, same file. `router.use(authenticate, requireAdmin)` — both middlewares run before the route handler.
12. **How the remediation works:** `requireAdmin` (in `backend/src/middleware/auth.ts`) checks `req.user.role === 'ADMIN'` and returns `403` otherwise. Restoring it to the middleware chain re-establishes role-based authorization on top of authentication.
13. **How to verify the fix:** Log in as Rahul, `GET /api/admin/users` → expect `403`. Log in as admin, same request → expect `200`.
14. **Tools that may detect it:** Same as V01 — manual testing or an authenticated ZAP/Burp scan comparing responses across roles. A code-level SAST rule (Semgrep) can also be written to flag admin routers that call `authenticate` without `requireAdmin`, since this is a structural pattern.
15. **Best detection approach:** Manual testing (primary), SAST as a secondary structural check (a Semgrep rule can catch "admin route missing role middleware" reliably since it's a code pattern, unlike V01's data-level check).
16. **Suggested AI prompts:** See `AI_SECURITY_PROMPTS.md`, section "V01B".

---

## V02 — Injection: SQL Injection via String Concatenation

1. **Vulnerability ID:** V02
2. **Vulnerability name:** SQL Injection (unsanitized string concatenation in a search query)
3. **OWASP category:** A03:2021 – Injection
4. **Feature:** Product Search
5. **API endpoint:** `GET /api/products/search?name=...`
6. **Vulnerable code location:** `backend/src/controllers/productController.ts`, function `searchProducts`
7. **What the normal user does:** Types a product name (e.g. "iphone") into the search box; the frontend calls `GET /api/products/search?name=iphone` and shows matching products.
8. **What the security tester changes:** First probes with a lone single quote (`?name=test'`) to check whether the input reaches SQL unescaped, then submits a crafted payload as the search term, e.g. `?name=nonexistentproduct' OR '1'='1' -- `.
9. **Expected vulnerable behavior:** The lone quote causes an HTTP `500` (a database syntax error — the query broke). The crafted payload returns **all 8 products** even though the literal search term ("nonexistentproduct") matches nothing — the injected `OR '1'='1'` makes the `WHERE` clause always true, and `--` comments out the rest of the original query.
10. **Why the vulnerability exists:** The handler builds the SQL string with a template literal (`` `...ILIKE '%${name}%'...` ``) instead of using a parameterized query placeholder. The database cannot tell user-supplied data apart from query syntax, so quote characters and SQL keywords in the input are interpreted as part of the query itself.
11. **Secured implementation:** `secured` branch, same file/function. The query goes back to a parameterized form: `pool.query("... WHERE name ILIKE $1 ...", [\`%${name}%\`])`.
12. **How the remediation works:** With a parameterized query, the database driver sends the SQL text and the user value as two separate channels. The database always treats `$1` as a single data value, no matter what characters it contains — there is no way for a quote or a keyword in the input to change the query's structure.
13. **How to verify the fix:** `?name=test'` → expect a normal `200` with an empty array (no product name contains a literal `'`), not a `500`. `?name=x' OR '1'='1' -- ` → expect `200` with an **empty array**, since the entire injected string is now treated as a literal (harmless) search term instead of SQL syntax.
14. **Tools that may detect it:** Semgrep (rule pattern: SQL built via template literal / string concatenation passed to a query function) reliably flags this at the **source-code** level. SQLMap or ZAP's active scan can confirm it **dynamically** by fuzzing the `name` parameter.
15. **Best detection approach:** SAST (Semgrep) is the fastest way to catch this class of bug before it ships; manual/DAST testing (the quote-probe technique above) is how a QA engineer without source access would find it.
16. **Suggested AI prompts:** See `AI_SECURITY_PROMPTS.md`, section "V02".

---

## V03 — Injection: Stored Cross-Site Scripting in Product Reviews

1. **Vulnerability ID:** V03
2. **Vulnerability name:** Stored XSS via unsafe HTML rendering of review comments
3. **OWASP category:** A03:2021 – Injection (Cross-Site Scripting)
4. **Feature:** Product Reviews
5. **API endpoint:** Written via `POST /api/products/:id/reviews`, rendered via `GET /api/products/:id/reviews`
6. **Vulnerable code location:** `frontend/src/pages/ProductDetail.tsx` — the review list renders `<p dangerouslySetInnerHTML={{ __html: review.comment }} />` instead of `<p>{review.comment}</p>`. (The backend stores the comment exactly as submitted — that part is normal and unchanged; the flaw is entirely in how it's rendered.)
7. **What the normal user does:** Writes a genuine review ("Great phone, camera quality is excellent!") which is stored and shown under the product.
8. **What the security tester changes:** Submits a review whose comment is `<img src=x onerror="alert('Security Training Demo')">` instead of plain text.
9. **Expected vulnerable behavior:** The review is stored as-is (the API happily accepts HTML in the `comment` field). The next time **any** visitor opens that product's page, the browser parses the stored comment as HTML, the `<img>` tag's invalid `src` fails to load, and its `onerror` handler fires, executing the attacker-supplied JavaScript in the victim's browser session. This is the difference between "reflected" (attacker's own request) and "stored" XSS: every visitor to the page is affected, not just the person who submitted the review.
10. **Why the vulnerability exists:** React escapes interpolated text by default (`{review.comment}` would have rendered the `<img ...>` as inert text, not markup). `dangerouslySetInnerHTML` is React's explicit, intentionally-named escape hatch that opts *out* of that protection — someone chose to render the comment as raw HTML, most plausibly to "support formatting," without sanitizing it first.
11. **Secured implementation:** `secured` branch, same file. Reverts to `<p>{review.comment}</p>` — plain text interpolation, which React automatically HTML-escapes.
12. **How the remediation works:** With plain interpolation, any `<`, `>`, `&`, or quote characters in the comment are rendered as literal, visible text (e.g. the browser displays the string `<img src=x onerror="...">` instead of running it) rather than being parsed as markup. Untrusted data is never treated as executable content.
13. **How to verify the fix:** Submit the same `<img src=x onerror=...>` review comment. Confirm no dialog fires and the product page instead displays the literal angle-bracket text of the payload.
14. **Tools that may detect it:** Semgrep has a built-in rule for `dangerouslySetInnerHTML` usage (flags it as a potential XSS sink regardless of whether the data is sanitized). OWASP ZAP's active scan can detect reflected/stored XSS patterns but works best combined with manual confirmation, since it can't always tell a false positive from real script execution.
15. **Best detection approach:** SAST (Semgrep) is the fastest way to catch `dangerouslySetInnerHTML` usage at review time; manual testing (submit a payload, reopen the page, watch for execution) is how a QA engineer verifies real-world impact.
16. **Suggested AI prompts:** See `AI_SECURITY_PROMPTS.md`, section "V03".

---

## V04A — Identification and Authentication Failures: No Login Rate Limiting

1. **Vulnerability ID:** V04A
2. **Vulnerability name:** Missing rate limiting / brute-force protection on login
3. **OWASP category:** A07:2021 – Identification and Authentication Failures
4. **Feature:** Login
5. **API endpoint:** `POST /api/auth/login`
6. **Vulnerable code location:** `backend/src/routes/authRoutes.ts` — no throttling middleware is mounted in front of the login route.
7. **What the normal user does:** Occasionally mistypes their password once or twice, then logs in successfully.
8. **What the security tester changes:** Scripts repeated `POST /api/auth/login` requests against one account with different passwords (a small, local, non-destructive test — the lab does not ship an automated credential-attack tool; the point is to observe that the server never pushes back).
9. **Expected vulnerable behavior:** Every attempt returns a normal `401` at full speed — no `429 Too Many Requests`, no delay, no temporary lockout, no CAPTCHA. Ten failed attempts in a row behave identically to one.
10. **Why the vulnerability exists:** The route has no rate-limiting or account-lockout middleware at all, so nothing bounds how many password guesses per second an attacker can send.
11. **Secured implementation:** `secured` branch adds a rate-limiting middleware (e.g. `express-rate-limit`) in front of `POST /api/auth/login`, keyed by IP (and optionally by the submitted email), returning `429` once a short window's attempt budget is exceeded.
12. **How the remediation works:** Bounding the request rate makes online brute-forcing impractically slow without meaningfully affecting a legitimate user who mistypes their password a couple of times.
13. **How to verify the fix:** Repeat the same rapid-fire login-attempt test; expect the responses to switch to `429` after the configured threshold instead of `401` indefinitely.
14. **Tools that may detect it:** OWASP ZAP's active scan includes brute-force/authentication tests; manual scripting (a small curl/Postman loop, as above) is the most direct way to see it.
15. **Best detection approach:** Manual/DAST testing — this is an operational/runtime behavior, not something SAST can see by reading code (absence of a middleware is hard to flag reliably by pattern-matching alone).
16. **Suggested AI prompts:** See `AI_SECURITY_PROMPTS.md`, section "V04A".

---

## V04B — Identification and Authentication Failures: Username Enumeration

1. **Vulnerability ID:** V04B
2. **Vulnerability name:** Username/account enumeration via differing login error messages
3. **OWASP category:** A07:2021 – Identification and Authentication Failures
4. **Feature:** Login
5. **API endpoint:** `POST /api/auth/login`
6. **Vulnerable code location:** `backend/src/controllers/authController.ts`, function `login`
7. **What the normal user does:** Enters their email and password and either logs in or sees a generic "that didn't work" message.
8. **What the security tester changes:** Submits a login with an email that is not registered, then submits a login with a known-registered email (e.g. `rahul@test.com`) and a wrong password. Compares the two error messages.
9. **Expected vulnerable behavior:** Unknown email → `{"error":"User does not exist"}`. Known email, wrong password → `{"error":"Incorrect password"}`. The two distinct messages let an attacker script a list of candidate emails and learn exactly which ones have accounts, without ever guessing a correct password.
10. **Why the vulnerability exists:** The handler branches on "user not found" vs "password mismatch" and returns a different, specific message for each case, prioritizing a (seemingly) more helpful error over not leaking account existence.
11. **Secured implementation:** `secured` branch, same file/function. Both the "unknown email" and "wrong password" branches return the identical generic message and status: `{"error":"Invalid email or password"}` with `401`.
12. **How the remediation works:** Since both failure cases are indistinguishable to the caller, an attacker cannot tell whether a given email exists in the system at all, closing the enumeration channel.
13. **How to verify the fix:** Repeat both requests from step 8 and confirm both now return the exact same `401` body.
14. **Tools that may detect it:** Manual testing (comparing two responses) is the standard technique; ZAP's passive scan can sometimes flag "user enumeration" if response differences are configured as a scan rule, but manual confirmation is more reliable here.
15. **Best detection approach:** Manual testing — this is a response-content comparison a scanner can approximate but a human (or a simple scripted diff) confirms definitively.
16. **Suggested AI prompts:** See `AI_SECURITY_PROMPTS.md`, section "V04B".

---

## V04C — Identification and Authentication Failures: Logout Does Not Invalidate the Token

1. **Vulnerability ID:** V04C
2. **Vulnerability name:** Session/token logout failure (token remains valid after logout)
3. **OWASP category:** A07:2021 – Identification and Authentication Failures
4. **Feature:** Logout
5. **API endpoint:** `POST /api/auth/logout`
6. **Vulnerable code location:** `backend/src/controllers/authController.ts`, function `logout`
7. **What the normal user does:** Clicks "Logout" in the nav bar; the frontend clears its local token and the app returns to the login screen.
8. **What the security tester changes:** Captures the JWT before logging out (e.g. from browser DevTools → Application → Local Storage, or from the login response in Postman), calls logout, then **replays the captured token** directly against a protected endpoint like `GET /api/orders` instead of trusting the UI.
9. **Expected vulnerable behavior:** `POST /api/auth/logout` returns `{"message":"Logged out successfully"}`, but the replayed token still returns `200` with the user's real order data — the token was never actually invalidated server-side, only removed from the browser's local storage.
10. **Why the vulnerability exists:** The `logout` handler returns a success message without writing anything to the `revoked_tokens` table. The `authenticate` middleware does check that table on every request (see `backend/src/middleware/auth.ts`), but since logout never adds a row, the check always finds nothing and the JWT stays valid until it naturally expires (`JWT_EXPIRES_IN`, 2 hours by default).
11. **Secured implementation:** `secured` branch, same file/function. `logout` inserts the token into `revoked_tokens` (`INSERT INTO revoked_tokens (token, user_id, revoked_at) VALUES ($1, $2, NOW())`) before responding.
12. **How the remediation works:** `authenticate` already rejects any token found in `revoked_tokens` with `401`. Once logout actually records the revocation, the very next request with that token is rejected, regardless of the JWT's own expiry.
13. **How to verify the fix:** Repeat the capture-token → logout → replay-token sequence; expect the replayed request to return `401 {"error":"Session has been logged out"}` instead of `200`.
14. **Tools that may detect it:** Manual testing (capture + replay, as above) or a scripted Postman/Newman collection. Not something SAST or a generic DAST crawl reliably catches, since it requires understanding the login → logout → reuse *sequence*, not a single request in isolation.
15. **Best detection approach:** Manual testing — session-lifecycle bugs like this require modeling a multi-step flow, which is a strength of human/manual testing over automated scanning.
16. **Suggested AI prompts:** See `AI_SECURITY_PROMPTS.md`, section "V04C".

---

*(Further vulnerabilities are appended below as they are introduced on the
`vulnerable` branch.)*
