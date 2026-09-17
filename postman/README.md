# Postman Collection — RSA SecureShop Vulnerability Demos

`RSA-SecureShop.postman_collection.json` is one request set that demonstrates
every vulnerability in this course purely through API calls and responses —
no browser needed (except V03, which is explicitly noted below). Import it
into Postman and it's ready to go; `base_url` and all auth tokens are
collection variables baked into the file, so there's nothing else to
configure.

## How to use it live

1. `git checkout vulnerable`
2. `docker compose down -v && docker compose up --build`
3. In Postman, open the **"0. Setup"** folder and run its 3 requests (top to
   bottom) — this logs in Rahul, Priya, and Admin and saves their tokens.
4. Open whichever vulnerability folder you're teaching (they're in the same
   order as `INSTRUCTOR_GUIDE.md`) and run its request(s). Read the
   response body together with the class.
5. When you're ready to show the fix: `git checkout secured`,
   `docker compose down -v && docker compose up --build`, re-run "0. Setup",
   then run the exact same folder again. Same request, different response —
   that's the whole demonstration.

Every folder's description (visible in Postman when you click the folder)
states exactly what to expect on each branch, so you don't need this file
open during class.

## What's NOT in this collection, and why

- **V03 (Stored XSS)** — the API's request/response is identical on both
  branches (the backend correctly stores whatever it's given, on purpose).
  The folder here only seeds the review; the actual difference only shows
  up when you open `http://127.0.0.1:3000/products/4` in a real browser
  afterward. See `tests/playwright/xss-regression.spec.ts` for the
  automated version.
- **V08 (Supply chain)** — this isn't a running-server vulnerability at
  all; it's a dependency pinned in `labs/supply-chain-demo/`. Demonstrate it
  with `cd labs/supply-chain-demo && npm install && npm audit` instead —
  there's no API request that would show it.

## The one gotcha: the login rate limiter (V04A)

On the `secured` branch, `POST /api/auth/login` is limited to 5 requests per
minute per IP — that's the actual fix for V04A, and it counts every call to
that route, success or failure. In a real class, with real explanation time
between folders, you will not hit this. But if you ever rehearse the whole
collection back-to-back with no pauses (e.g., Postman's Collection Runner
or `newman run` with no delay), Setup's 3 logins plus V04B's 2 login
attempts already add up to 5 — so V04C's login becomes the 6th call and
gets legitimately blocked with 429, which cascades into unrelated 401s for
the rest of that folder.

That's the rate limiter doing exactly what it's supposed to, not a bug in
this collection — and it's arguably a good live example of how a tight rate
limit can bite even a legitimate rapid workflow. If you want a clean rapid
rehearsal run, add a small delay between requests in the Collection Runner,
or just wait 60 seconds and re-run "0. Setup" before continuing.

The V04A folder itself is placed **last** in the collection for this exact
reason — it deliberately burns through the rate limit on purpose, so it's
placed where it can't disrupt anything before it.

## Verified

Every request in this collection has been run against both branches (via
`newman`, Postman's CLI runner) and confirmed to produce exactly the status
codes and response bodies described in each folder — both in a rapid pass
(where the rate-limiter interaction above shows up, as expected) and in a
realistically-paced run (15s between requests), which passes cleanly
end-to-end with zero failures.
