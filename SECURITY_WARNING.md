# Security Warning

**RSA SecureShop intentionally contains real security vulnerabilities.**
This is not accidental poor code quality — the `vulnerable` branch is a
deliberately unsafe application, built for a security-testing course. Treat
it accordingly.

## Never do this

- Deploy this application to any public/internet-facing infrastructure.
- Connect it to a real production database, or any database containing real
  data.
- Run it on infrastructure that holds real secrets, credentials, API keys,
  or access to other systems.
- Reuse the seeded passwords (`Rahul123!`, `Priya123!`, `Admin123!`), the
  JWT secret, or any other value from `.env.example` anywhere outside this
  lab.
- Expose it on your local network beyond your own machine (don't bind it to
  `0.0.0.0`, don't port-forward it, don't put it on a shared Wi-Fi where
  others could reach it).
- Run it side by side with, or on the same host as, a real production
  application, especially anything that shares credentials or a network
  with it.
- Use the techniques demonstrated in this course against any system you do
  not have explicit authorization to test. Everything here is scoped to
  this application, running on your own machine, for learning purposes only.

## Recommended environment

- An isolated local Docker environment (Docker Desktop or equivalent) on
  your own machine.
- No other sensitive applications, credentials, or production access should
  be reachable from the same environment while this is running.
- All services are bound to `127.0.0.1` only by default (see
  `docker-compose.yml`) — this is intentional and should not be changed to
  `0.0.0.0` or a public IP.

## What's actually safe here

- All accounts, passwords, orders, and reviews are synthetic training data.
- The JWT secret and the `FAKE_DEMO_API_KEY` value are clearly fake, dummy,
  local-only values — not real credentials for any real service.
- There is no integration with real payment providers, real email
  providers, or real cloud services (AWS/GCP/Azure).
- The XSS demonstration (V03) only ever pops a harmless
  `alert('Security Training Demo')` or similar - it never exfiltrates
  cookies, tokens, or any data.
- Nothing in this application makes outbound requests to arbitrary
  attacker-controlled or internet hosts (no SSRF-style functionality).

If you're ever unsure whether something is safe to try, the answer is: keep
it local, keep it inside this Docker Compose stack, and don't point any part
of it at a real system.
