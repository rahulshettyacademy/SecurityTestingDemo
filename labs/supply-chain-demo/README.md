# Supply Chain Demo — V08 (secured branch)

This is an **isolated** teaching lab for Software Composition Analysis (SCA)
tooling. It is intentionally separate from the main RSA SecureShop
application:

- It has its own `package.json` and `package-lock.json`.
- It is **not** referenced by `backend/package.json`, `frontend/package.json`,
  or `docker-compose.yml` in any way.
- Nothing in this folder is installed, built, or run when you start the main
  application.

## This is the patched copy

On the `vulnerable` branch, this same folder pins `lodash` to `4.17.15` — a
version with several publicly documented advisories (prototype pollution,
command/code injection, ReDoS). **This copy, on the `secured` branch, pins
`lodash` to `^4.18.1`** — the current patched release at the time this lab
was built.

`merge-preferences.js` is unchanged between branches: it illustrates a
plausible real-world usage of lodash (`_.merge`, combining a user's saved
preferences with request overrides). The only difference between the two
branches is the pinned dependency version in `package.json`.

## Running the exercise

```bash
cd labs/supply-chain-demo
npm install
npm audit
```

## Expected output on this branch

```
found 0 vulnerabilities
```

Compare this against the `vulnerable` branch's copy of this same folder
(`git show vulnerable:labs/supply-chain-demo/package.json`), which reports a
high-severity finding against `lodash <=4.17.23`. See
`VULNERABILITY_MAP.md` (V08) and `INSTRUCTOR_GUIDE.md` for the full
write-up, and `BRANCH_COMPARISON.md` for how to diff the two branches.
