# Student Guide — RSA SecureShop

Welcome to RSA SecureShop, the practice application for this course. It's a
small e-commerce site — browse products, add to cart, check out, view your
orders, leave reviews, manage your profile. It looks and works like a real
online store. Somewhere underneath, it isn't as safe as it looks. Finding
out where is the exercise.

This guide will **not** tell you what the vulnerabilities are or how to fix
them — that's the point. Your instructor will reveal each one at the right
moment in the course. Use this guide to get the app running and to structure
how you explore it.

## Setup

```bash
git clone <repo url>
cd secapp
git checkout vulnerable
cp .env.example .env
docker compose up --build
```

- App: <http://127.0.0.1:3000>
- API: <http://127.0.0.1:5000/api>

If `http://localhost:...` doesn't work but `http://127.0.0.1:...` does,
that's expected on some machines (see the README's troubleshooting section)
— it's not part of the exercise.

## Your accounts

| Email | Password | Role |
|---|---|---|
| `rahul@test.com` | `Rahul123!` | Customer |
| `priya@test.com` | `Priya123!` | Customer |
| `admin@test.com` | `Admin123!` | Admin |

You can also register your own account from the UI.

## How to approach this

Work through these roughly in order. Don't rush to "find the bug" — spend
real time in step 1 first. Most testers who skip straight to poking at the
API miss things that were obvious from just using the app normally.

### 1. Explore it like a customer

Use the whole app the way a real shopper would: browse products, search,
add things to your cart, check out, look at your past orders, leave a
review, update your profile. Notice what data you can see and what actions
you can take at each step. Do this logged in as Rahul, then again as Priya,
then again as the admin — notice what's different between them.

### 2. Open your browser's DevTools

- **Network tab:** reload a few pages and watch the actual API calls the
  frontend makes. What endpoint does each action hit? What does the request
  body look like? What comes back in the response — is it exactly what the
  UI shows you, or more?
- **Application/Storage tab:** where does the app keep your login session?
  What does it actually contain?
- **Console tab:** anything logged that's unexpected?

### 3. Map the attack surface

From what you saw in the Network tab, write down (mentally or literally)
every API endpoint you've observed, which ones need you to be logged in,
and which ones behave differently for the admin account vs. a customer
account. This list is your starting point for step 4.

### 4. Start manipulating requests

Now go beyond what the UI lets you click. Useful tools for this:

- Your browser's DevTools (right-click a network request → "Edit and
  Resend," or similar, depending on your browser)
- [Postman](https://www.postman.com/) or `curl` from a terminal
- Your browser's own address bar, for GET requests

Things worth trying, once you have a real request captured: what happens if
you change an ID in the URL to a different number? What if you change a
value in the request body to something the UI would never send? What if you
send a request you're not logged in for, or logged in as the "wrong" user
for? What happens if you put unexpected characters into a text field?

You don't need to know in advance which of these will do something
interesting — that's what testing is. Keep notes on anything that responds
in a way you didn't expect.

### 5. Inspect the source code (only when your instructor tells you to)

The full source is right here in this repository. At some point in the
course your instructor will tell you it's time to go read specific files.
Until then, try to find things through testing the running app first — that
mirrors how you'd approach an application you didn't have source access to.

## When you're ready to compare fixes

Once your instructor has walked through a vulnerability with you, they may
have you switch branches to see the fix:

```bash
git checkout secured
docker compose down -v && docker compose up --build
```

Try the same request you tampered with before — see what's different now.
Then switch back:

```bash
git checkout vulnerable
docker compose down -v && docker compose up --build
```

## A note on scope

Everything you do in this course should stay inside this application,
running locally on your own machine. See `SECURITY_WARNING.md` for the full
detail, but the short version: nothing you learn here should be pointed at
a system you don't have explicit permission to test.
