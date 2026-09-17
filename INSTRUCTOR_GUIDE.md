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

*(Further vulnerabilities are appended below as they are introduced on the
`vulnerable` branch.)*
