# Security Regression Tests

Jest + Supertest tests that validate the fixes described in
`INSTRUCTOR_GUIDE.md` and `VULNERABILITY_MAP.md`. **These are written to
pass on the `secured` branch.** Running them against `vulnerable` will fail
every suite — that's expected, and is exactly how they prove each fix
actually works (see the commit history / `BRANCH_COMPARISON.md` for a record
of that check).

## How these tests work

Each test imports the backend's `createApp()` directly from
`../backend/src/app.ts` (in-process, via Supertest) instead of hitting a
running Docker container over HTTP. This guarantees the tests always
exercise whatever code is actually checked out on the current branch, even
if a Docker image is stale. It does mean these tests need a **real Postgres
instance** to talk to — they are not mocked.

## Running

```bash
# from the repository root
docker compose up -d postgres   # or `docker compose up -d` for the full stack
cd security-tests
npm install
npm test
```

Postgres must be reachable at `127.0.0.1:5432` (the default in
`docker-compose.yml` — see the root `.env.example`). No other services need
to be running; the backend and frontend containers are not required for
this suite.

## Coverage

| Test file | Vulnerability |
|---|---|
| `v01-idor.test.ts` | V01 — Broken Access Control (IDOR) |
| `v01b-vertical-privilege.test.ts` | V01B — Broken Access Control (vertical) |
| `v02-sql-injection.test.ts` | V02 — SQL Injection |
| `v04a-rate-limit.test.ts` | V04A — No login rate limiting |
| `v04b-username-enumeration.test.ts` | V04B — Username enumeration |
| `v04c-logout-invalidation.test.ts` | V04C — Logout token replay |
| `v05-password-hashing.test.ts` | V05 — Plaintext password storage |
| `v06a-verbose-errors.test.ts` | V06A/V06C — Verbose error responses |
| `v06b-debug-endpoint.test.ts` | V06B — Exposed debug endpoint |
| `v07-price-manipulation.test.ts` | V07 — Client-controlled checkout price |

**V03 (Stored XSS)** is not tested here — it's a frontend rendering bug, so
backend behavior is identical on both branches. Its regression test lives in
`tests/playwright/` instead. **V08 (supply chain)** has no Jest test; its
"regression test" is re-running `npm audit` in `labs/supply-chain-demo/`.

## A note on `--runInBand`

`npm test` runs Jest with `--runInBand` (sequential, not parallel). This
matters here specifically: JWTs are signed deterministically, and two
logins for the same user within the same second can produce byte-identical
tokens. Running test files in parallel against the same live database can
then cause one file's logout (which revokes a token) to affect another
file's still-in-use token. Sequential execution avoids this entirely.
