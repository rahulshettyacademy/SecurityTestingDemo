# Branch Comparison — `vulnerable` vs `secured`

Both branches share the same functional baseline (they fork from the same
`main` commit) and preserve the same screens, APIs, database schema, and
user workflows throughout. Only the specific insecure implementations
differ. This document is the quick-reference summary; `INSTRUCTOR_GUIDE.md`
has the full write-up for each row.

| ID | Vulnerability | Vulnerable branch | Secured branch | Core fix | Regression test |
|---|---|---|---|---|---|
| V01 | IDOR on order lookup | No ownership check | Checks `order.user_id` matches the caller (or admin) | Re-add the ownership comparison before returning the row | `security-tests/tests/v01-idor.test.ts` |
| V01B | Vertical privilege escalation | `requireAdmin` missing from the route | `requireAdmin` restored to the middleware chain | Restore the role-check middleware | `security-tests/tests/v01b-vertical-privilege.test.ts` |
| V02 | SQL Injection | Query built via template-literal concatenation | Parameterized query (`$1` placeholder) | Stop building SQL from user input as text | `security-tests/tests/v02-sql-injection.test.ts` |
| V03 | Stored XSS | `dangerouslySetInnerHTML` renders review comments | Plain `{review.comment}` interpolation (React's default escaping) | Stop opting out of React's HTML escaping | `tests/playwright/xss-regression.spec.ts` |
| V04A | No login rate limiting | No throttling middleware | `express-rate-limit` (5/min) added | Add a rate limiter in front of login | `security-tests/tests/v04a-rate-limit.test.ts` |
| V04B | Username enumeration | Distinct "User does not exist" / "Incorrect password" messages | One generic "Invalid email or password" message | Stop branching the error message on which check failed | `security-tests/tests/v04b-username-enumeration.test.ts` |
| V04C | Logout doesn't invalidate token | `logout` never writes to `revoked_tokens` | `logout` inserts the token into `revoked_tokens` | Actually record the revocation on logout | `security-tests/tests/v04c-logout-invalidation.test.ts` |
| V05 | Plaintext passwords | Stored/compared as plain text | `bcrypt.hash` / `bcrypt.compare` | Hash on write, compare with bcrypt | `security-tests/tests/v05-password-hashing.test.ts` |
| V06A/V06C | Verbose error responses | Stack trace / DB error / file path returned to the client | Always the generic message; real error only logged server-side | Remove the `NODE_ENV`-gated verbose branch | `security-tests/tests/v06a-verbose-errors.test.ts` |
| V06B | Exposed debug endpoint | `GET /api/debug/config`, no auth | Route not mounted at all | Delete the route | `security-tests/tests/v06b-debug-endpoint.test.ts` |
| V07 | Checkout trusts client price | `item.price` from the request body used if present | Price always re-read from the `products` table | Stop reading price from client input | `security-tests/tests/v07-price-manipulation.test.ts` |
| V08 | Outdated dependency (SCA) | `labs/supply-chain-demo` pins `lodash@4.17.15` | Pins `lodash@^4.18.1` | Bump the dependency version | Re-run `npm audit` (no Jest test — see `INSTRUCTOR_GUIDE.md`) |

## Using `git diff` to compare the branches

```bash
# Everything that changed, across the whole app
git diff vulnerable..secured

# Just the application code (skip docs/tests, which mostly only grew)
git diff vulnerable..secured -- backend/src frontend/src database labs

# One specific vulnerability
git diff vulnerable..secured -- backend/src/controllers/orderController.ts
```

The second command above is the one worth running live in class — it shows
exactly and only the 14 files touched by the 8 vulnerability groups (no
noise from documentation or test suites, which exist identically on both
branches). Each hunk in that diff corresponds to exactly one row in the
table above.

A few things worth pointing out when you run it:

- Most hunks are **small and surgical** — one guard clause, one line of SQL,
  one JSX prop. That's intentional: a real fix is rarely a rewrite.
- `authController.ts`, `orderController.ts`, and `errorHandler.ts` each
  carry more than one fix (V04B+V05 in `authController.ts`;
  V01+V07 in `orderController.ts`; V06A/C in `errorHandler.ts`) — worth
  calling out that "one file, several vulnerabilities" is realistic.
- `database/seed.sql` differs only in the `users` table's `password` column
  (plaintext vs. bcrypt hash) — everything else (products, orders, reviews)
  is byte-identical between branches.
- `labs/supply-chain-demo/` differs only in the pinned `lodash` version —
  `merge-preferences.js` is untouched.

## What's identical between the branches (and why that matters)

Screens, routes, the database schema, seeded account credentials (except
V05's storage format), and the overall UI are the same on both branches. If
a student's exploit from the `vulnerable` branch produces a *different kind*
of error on `secured` (not just "blocked," but something that looks broken),
that's worth investigating — the fix should close the vulnerability without
changing the legitimate user experience. This is also how the security
regression tests are designed: each one exercises the same request shape on
both branches and asserts a different (safe) outcome, not a different
feature.
