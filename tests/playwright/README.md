# Playwright End-to-End / Regression Tests

Assumes the full stack is already running via `docker compose up -d` at
`http://127.0.0.1:3000` (frontend) and `http://127.0.0.1:5000` (backend).

## Running

```bash
cd tests/playwright
npm install
npx playwright install chromium   # first run only
npm test
```

## What's here

`xss-regression.spec.ts` is the regression test for **V03 (Stored XSS)**.
Unlike every other vulnerability in this course, V03 is a frontend
rendering bug — the backend stores review comments unmodified on both the
`vulnerable` and `secured` branches, so there is no API-level difference a
Supertest test could assert on. This test drives a real Chromium browser,
submits a review containing a harmless `alert('Security Training Demo')`
payload via the API, opens the product page, and asserts:

- the payload renders as literal, visible text (not parsed as markup), and
- no dialog fires.

It fails on the `vulnerable` branch (the payload executes) and passes on
`secured` (React's default escaping renders it as inert text). See
`INSTRUCTOR_GUIDE.md` (V03) for the full write-up.
