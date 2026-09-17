# RSA SecureShop

> **Security Training Lab — Deliberately Vulnerable Application.**
> Run only in an isolated local environment. See `SECURITY_WARNING.md`
> before doing anything else.

RSA SecureShop is a small, realistic e-commerce application built for the
course **"AI-Driven Security Testing for Web & API Applications."** It looks
and works like a normal online store — login, product catalog, cart,
checkout, orders, reviews, an admin area — but the `vulnerable` branch has a
curated set of real, intentionally-introduced security vulnerabilities
underneath, and the `secured` branch shows how each one is actually fixed.

It is not a CTF or a hacking-challenge UI. The goal is: this should feel like
a normal application you're testing, not an obvious puzzle.

## Branches

| Branch | Purpose |
|---|---|
| `main` | Internal baseline. The fully functional app with no intentional vulnerabilities. Not used directly in the course. |
| `vulnerable` | **Start here.** What students run and test. |
| `secured` | The remediated version, used later to compare against `vulnerable` and see how each fix works. |

```bash
git clone <this repo>
cd secapp
git checkout vulnerable
```

See `STUDENT_GUIDE.md` for the student-facing walkthrough and
`INSTRUCTOR_GUIDE.md` for the full technical write-up of every vulnerability.

## Tech stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL
- **Infra:** Docker Compose (everything runs locally, bound to `127.0.0.1` only)

## Quick start

```bash
git checkout vulnerable          # or `secured`
cp .env.example .env
docker compose up --build
```

- Frontend: <http://127.0.0.1:3000>
- Backend API: <http://127.0.0.1:5000/api>
- PostgreSQL: `127.0.0.1:5432` (not exposed publicly — see `SECURITY_WARNING.md`)

To reset to a clean seeded state at any time:

```bash
docker compose down -v && docker compose up --build
```

### Troubleshooting: "localhost" not working on macOS

If `http://localhost:5000` or `http://localhost:3000` don't respond (or hit
the wrong thing), it's almost certainly **not** a bug in this app — macOS's
AirPlay Receiver also listens on port 5000, and "localhost" can resolve to
`::1` (IPv6) before `127.0.0.1` (IPv4), landing on an unrelated service. Two
fixes, either works:

- Use `http://127.0.0.1:3000` / `http://127.0.0.1:5000` explicitly (the
  frontend's default API URL already does this internally), or
- System Settings → General → AirDrop & Handoff → turn off AirPlay Receiver.

## Seeded accounts

| Role | Email | Password | User ID |
|---|---|---|---|
| Customer | `rahul@test.com` | `Rahul123!` | 101 |
| Customer | `priya@test.com` | `Priya123!` | 102 |
| Admin | `admin@test.com` | `Admin123!` | 1 |

All synthetic, local-only training data. Orders 1001 and 1003 belong to
Rahul; 1002 and 1004 belong to Priya (used throughout the Broken Access
Control exercises).

## API overview

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register` | |
| POST | `/api/auth/login` | |
| POST | `/api/auth/logout` | requires auth |
| GET | `/api/products` | |
| GET | `/api/products/search?name=` | |
| GET | `/api/products/:id` | |
| GET/POST | `/api/products/:id/reviews` | POST requires auth |
| GET | `/api/orders` | requires auth, own orders only |
| GET | `/api/orders/:orderId` | requires auth |
| POST | `/api/orders` | requires auth (checkout) |
| GET/PUT | `/api/profile` | requires auth |
| GET | `/api/admin/users` | requires auth + ADMIN role |
| POST | `/api/password-reset/request` | |
| POST | `/api/password-reset/confirm` | |

## Tests

```bash
# Security regression tests (validates the secured branch)
docker compose up -d postgres
cd security-tests && npm install && npm test

# XSS regression test (needs the full stack running)
docker compose up -d
cd tests/playwright && npm install && npx playwright install chromium && npm test
```

See `security-tests/README.md` and `tests/playwright/README.md` for details.

## Scanner support

This repo is set up for hands-on practice with all four major scanning
approaches. See `INSTRUCTOR_GUIDE.md` for which tool is the *right* one for
each specific vulnerability (they're not interchangeable — that's part of
the lesson).

**SAST**
```bash
pip install semgrep
semgrep --config .semgrep/rsa-secureshop-rules.yml backend/src frontend/src
```
Expect 3 findings on `vulnerable`, 0 on `secured`. Semgrep's free registry
rulesets (`p/owasp-top-ten`, `p/security-audit`) find **zero** issues on
either branch — see the comment header in `.semgrep/rsa-secureshop-rules.yml`
for why that's an intentional teaching point about generic vs. custom rules.
CodeQL runs automatically via `.github/workflows/codeql.yml` on push/PR.

**DAST (local only)**
```bash
docker compose up -d
docker run --rm -t --network host \
  -v $(pwd):/zap/wrk/:rw \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://127.0.0.1:3000 -r zap-report.html
```
Only ever point ZAP at `127.0.0.1` — never at a public URL.

**SCA**
```bash
cd backend && npm audit    # expect 0 vulnerabilities on both branches
cd frontend && npm audit   # expect 0 vulnerabilities on both branches
cd labs/supply-chain-demo && npm install && npm audit  # see V08
```

**Secret scanning**
```bash
brew install gitleaks   # or see gitleaks.io
gitleaks detect --source . --config .gitleaks.toml
```
Default gitleaks rules find nothing here — see `.gitleaks.toml`'s header
comment for why, and what the custom rule adds.

`.github/workflows/security.yml` wires SAST/SCA/regression tests into a
single CI pipeline, branch-aware so `vulnerable`'s intentional findings
never fail its build (see the workflow's own header comment for the exact
gating logic).

## Documentation map

- `SECURITY_WARNING.md` — read this first
- `STUDENT_GUIDE.md` — student-facing setup and exercises
- `INSTRUCTOR_GUIDE.md` — full technical write-up of every vulnerability
- `VULNERABILITY_MAP.md` — master index (ID → OWASP category → code location)
- `BRANCH_COMPARISON.md` — how to diff `vulnerable` against `secured`
- `AI_SECURITY_PROMPTS.md` — AI prompts for each vulnerability, organized by teaching stage
