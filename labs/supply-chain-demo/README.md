# Supply Chain Demo — V08

This is an **isolated** teaching lab for Software Composition Analysis (SCA)
tooling. It is intentionally separate from the main RSA SecureShop
application:

- It has its own `package.json` and `package-lock.json`.
- It is **not** referenced by `backend/package.json`, `frontend/package.json`,
  or `docker-compose.yml` in any way.
- Nothing in this folder is installed, built, or run when you start the main
  application. Vulnerable Vulnerability V08 exists purely so `npm audit`
  (or another SCA tool) has something real to find, without putting an
  outdated, vulnerable dependency anywhere near the actual running app.

## The vulnerability

`package.json` here pins `lodash` to version **4.17.15** — a version that
predates fixes for several real, publicly documented lodash advisories,
including prototype pollution and command/code injection issues. `lodash`
is a very common, legitimate dependency (used here via `_.merge`, in
`merge-preferences.js`, to illustrate a plausible real-world usage: merging
a user's saved preferences with request overrides).

**Students do not need to exploit anything.** The exercise is entirely
about *detecting* the outdated dependency using standard SCA tooling — this
is the class of vulnerability that manual testing essentially never finds
and automated dependency scanning finds immediately.

## Running the exercise

```bash
cd labs/supply-chain-demo
npm install
npm audit
```

## Expected output (abridged)

At the time this lab was built, `npm audit` reported:

```
# npm audit report

lodash  <=4.17.23
Severity: high
Command Injection in lodash - https://github.com/advisories/GHSA-35jh-r3h4-6jhm
Prototype Pollution in lodash - https://github.com/advisories/GHSA-p6mc-m468-83gw
Regular Expression Denial of Service (ReDoS) in lodash - https://github.com/advisories/GHSA-29mw-wpgm-hmr9
lodash vulnerable to Code Injection via `_.template` imports key names - https://github.com/advisories/GHSA-r5fr-rjxr-66jc
lodash vulnerable to Prototype Pollution via array path bypass in `_.unset` and `_.omit` - https://github.com/advisories/GHSA-f23m-r3pf-42rh
Lodash has Prototype Pollution Vulnerability in `_.unset` and `_.omit` functions - https://github.com/advisories/GHSA-xxjr-mmjv-4gpg
fix available via `npm audit fix --force`

1 high severity vulnerability
```

The exact advisory list can grow over time as new lodash CVEs are
published against old versions — that's expected and part of the lesson
(the npm advisory database is a moving target, not a fixed snapshot).

## The fix

Run:

```bash
npm audit fix --force
```

or manually bump the dependency in `package.json`:

```json
"dependencies": {
  "lodash": "^4.18.1"
}
```

(Use whatever the current latest published `4.x` release is — `npm view
lodash version` shows it — since lodash patches are cumulative and a newer
4.x release carries forward all prior fixes.)

After upgrading and re-running `npm install && npm audit`, the report
should show **0 vulnerabilities**.

## Why this matters for the main app

The main RSA SecureShop `backend/` and `frontend/` dependency trees are
kept clean on purpose (`npm audit` returns 0 vulnerabilities in both, and
this is checked as part of the build) — this lab exists so students still
get hands-on practice with SCA output without weakening the real
application's dependencies. See `VULNERABILITY_MAP.md` (V08) and
`INSTRUCTOR_GUIDE.md` for the full write-up.
