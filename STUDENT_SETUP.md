# Student Setup Guide — RSA SecureShop

This guide gets the training lab running on **your own machine**. By the end you
will be able to run the **vulnerable** app and the **secured** app — each with
its own frontend (FE), backend API (BE), and database — exactly like the setup
used in class.

Everything runs locally inside Docker and is bound to `127.0.0.1` only, so
nothing is exposed to your network. Read `SECURITY_WARNING.md` once before you
start — this is a deliberately vulnerable app, meant only for an isolated local
machine.

---

## 1. What you will end up with

| App | Frontend (open in browser) | Backend API | Database |
|---|---|---|---|
| **Vulnerable** | http://127.0.0.1:3000 | http://127.0.0.1:5000/api | `127.0.0.1:5432` |
| **Secured** | http://127.0.0.1:3001 | http://127.0.0.1:5001/api | `127.0.0.1:5433` |

You can run them **one at a time** (simplest — Section 4) or **both side by
side** for comparison (Section 5). Start with one at a time.

> Always use `127.0.0.1`, not `localhost`. On macOS especially, `localhost` can
> resolve to IPv6 (`::1`) and land on an unrelated service (AirPlay also uses
> port 5000). See Troubleshooting.

---

## 2. Prerequisites (install once)

1. **Docker Desktop** — https://www.docker.com/products/docker-desktop/
   - Windows: during install, keep **"Use WSL 2"** enabled.
   - After install, **launch Docker Desktop and wait** until it says *Running*.
2. **Git** — https://git-scm.com/downloads

Check both are installed (any recent version is fine):

```bash
docker --version
```

```bash
docker compose version
```

```bash
git --version
```

If `docker compose version` errors but `docker-compose --version` works, you
have the old v1 syntax — use `docker-compose` in place of `docker compose`
everywhere below.

---

## 3. Get the code

```bash
git clone <REPO_URL> secapp
```

```bash
cd secapp
```

Replace `<REPO_URL>` with the repository link your instructor gave you. This
folder (`secapp`) is your **vulnerable** copy.

---

## 4. Run one app at a time (recommended first)

### 4a. Vulnerable app

From inside the `secapp` folder:

```bash
git checkout vulnerable
```

```bash
cp .env.example .env
```

```bash
docker compose up --build -d
```

First run downloads images and builds — it can take a few minutes. When it
finishes, open:

- Frontend: **http://127.0.0.1:3000**
- API check: **http://127.0.0.1:5000/api**

Log in with a seeded account (see Section 6).

### 4b. Switch to the secured app

The secured app lives on the `secured` branch. To swap the same folder over to
it, first stop the vulnerable stack, then switch branch and bring it back up:

```bash
docker compose down
```

```bash
git checkout secured
```

```bash
cp .env.example .env
```

```bash
docker compose up --build -d
```

Because you took the vulnerable stack down first, this reuses the **same ports**
(3000 / 5000). The app now behaves as the secured version. Open
http://127.0.0.1:3000 again.

> Switching branches this way means only one app runs at a time. To see both
> **at once**, use Section 5 instead.

---

## 5. Run both apps side by side (for comparison)

This is what we use in class to compare "unsecured vs secured" live. You keep
your `secapp` folder on the **vulnerable** branch, and make a **second copy**
for the secured branch on different ports.

### 5a. Start the vulnerable app (ports 3000 / 5000)

In your existing `secapp` folder:

```bash
git checkout vulnerable
```

```bash
docker compose -p secureshop-vuln up --build -d
```

### 5b. Make a second copy for the secured app

From the folder that **contains** `secapp` (one level up):

```bash
git clone <REPO_URL> secapp-secured
```

```bash
cd secapp-secured
```

```bash
git checkout secured
```

```bash
cp .env.example .env
```

### 5c. Add the port override file

The secured copy needs to run on **different ports** so it doesn't collide with
the vulnerable one. Create a file named **`docker-compose.override.yml`** in the
`secapp-secured` folder with exactly this content:

```yaml
# Local override so the secured stack can run alongside the vulnerable one.
services:
  postgres:
    ports: !override
      - "127.0.0.1:5433:5432"
  backend:
    environment:
      CORS_ORIGIN: http://localhost:3001,http://127.0.0.1:3001
    ports: !override
      - "127.0.0.1:5001:5000"
  frontend:
    environment:
      VITE_API_BASE_URL: http://127.0.0.1:5001/api
    ports: !override
      - "127.0.0.1:3001:3000"
```

Docker Compose picks up a file named `docker-compose.override.yml`
automatically — you do not need to name it on the command line.

### 5d. Start the secured app (ports 3001 / 5001)

Still inside `secapp-secured`:

```bash
docker compose -p secureshop-secured up --build -d
```

Now both are running:

- **Vulnerable:** http://127.0.0.1:3000 · API http://127.0.0.1:5000/api
- **Secured:** http://127.0.0.1:3001 · API http://127.0.0.1:5001/api

The `-p` name keeps each stack (and its database) completely separate.

---

## 6. Verify it works

Open the frontend and log in with any seeded account:

| Role | Email | Password |
|---|---|---|
| Customer | `rahul@test.com` | `Rahul123!` |
| Customer | `priya@test.com` | `Priya123!` |
| Admin | `admin@test.com` | `Admin123!` |

These are synthetic, local-only training accounts.

Quick API check from the terminal (should return JSON, not an error):

```bash
curl http://127.0.0.1:5000/api/products
```

---

## 7. Reset to a clean, freshly-seeded state

If you've changed data and want to start over, the `-v` flag wipes the
database volume so it re-seeds on the next start.

One app at a time (in `secapp`):

```bash
docker compose down -v && docker compose up --build -d
```

Side-by-side copies (run in the matching folder, with the matching `-p` name):

```bash
docker compose -p secureshop-vuln down -v && docker compose -p secureshop-vuln up --build -d
```

```bash
docker compose -p secureshop-secured down -v && docker compose -p secureshop-secured up --build -d
```

---

## 8. Stop everything

Stop but keep data (fast to restart):

```bash
docker compose down
```

For the side-by-side copies, add the project name:

```bash
docker compose -p secureshop-vuln down
```

```bash
docker compose -p secureshop-secured down
```

---

## 9. Troubleshooting

**`localhost` doesn't respond (especially on macOS).**
Use `http://127.0.0.1:3000` / `:5000` explicitly. macOS's AirPlay Receiver also
listens on port 5000; turn it off under System Settings → General → AirDrop &
Handoff → AirPlay Receiver, or just use `127.0.0.1`.

**"port is already allocated" / "address already in use".**
Another process (often a previous run) holds that port. Stop the old stack with
`docker compose down` (add the right `-p` name), or make sure you're not running
the vulnerable and secured copies on the same ports — the secured copy must have
the override file from Section 5c.

**"Cannot connect to the Docker daemon."**
Docker Desktop isn't running. Launch it and wait until it shows *Running*, then
retry.

**Build is very slow or fails the first time.**
The first build downloads base images and installs dependencies; give it a few
minutes. If it fails midway, rerun the same `docker compose up --build -d`.

**Changes to data look stuck / app behaves oddly.**
Do a clean reset (Section 7). The `-v` flag re-seeds the database.

**Windows: files look corrupted inside the container, or scripts fail.**
Make sure Git isn't converting line endings. If you hit this, run
`git config --global core.autocrlf input`, delete the folder, and clone again.

**I'm not sure what's running.**
List active containers:

```bash
docker compose ps
```

```bash
docker ps
```

---

## 10. Which app is which? (quick recap)

- **Vulnerable branch** → the app you test and find flaws in. Ports 3000 / 5000.
- **Secured branch** → the remediated app you compare against. Ports 3001 / 5001
  when run side by side.

See `STUDENT_GUIDE.md` for the testing walkthrough once your setup is running.
