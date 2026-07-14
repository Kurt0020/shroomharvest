# ShroomHarvest

A Shopify custom theme + "Smart Inventory Insights" embedded admin app,
built module by module.

This README covers **Module 0 — Project Initialization** only. Each
later module will extend it.

---

## Project structure

```
shroomharvest/
├── shopify.app.toml        # Shopify CLI app config
├── docker-compose.yml       # Local MySQL + Adminer
├── .env.example              # All required environment variables
├── package.json              # npm workspaces root
│
├── theme/                    # Shopify Liquid theme
│   ├── layout/theme.liquid
│   ├── sections/
│   ├── templates/
│   ├── snippets/
│   ├── assets/
│   ├── config/
│   └── locales/
│
└── app/                      # Embedded admin app
    ├── client/                # Vite + React + TypeScript (frontend)
    │   └── src/
    └── server/                # Node.js + Express + TypeScript (backend)
        ├── src/
        │   ├── db/            # Drizzle client, schema, migrate, seed
        │   └── routes/
        └── drizzle.config.ts
```

---

## Prerequisites

You need four things installed before touching this repo: **Node.js**, **Docker**, **Git**, and the **Shopify CLI**. Full install steps for each, per OS, below. Skip anything you already have — just verify the version.

### 1. Node.js 18+

**Check if you already have it:**
```bash
node -v
```
If it prints `v18.x.x` or higher, skip ahead. Otherwise:

**macOS:**
```bash
# Option A — Homebrew (recommended)
brew install node@20

# Option B — nvm (lets you switch Node versions per project)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# restart your terminal, then:
nvm install 20
nvm use 20
```

**Windows:**
```powershell
# Option A — download the installer
# Go to https://nodejs.org and download the "LTS" Windows installer, then run it.

# Option B — winget (Windows Package Manager, built into Win 10/11)
winget install OpenJS.NodeJS.LTS

# Option C — nvm-windows (https://github.com/coreybutler/nvm-windows/releases)
# download nvm-setup.exe, install, then:
nvm install 20.14.0
nvm use 20.14.0
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Linux (Fedora):**
```bash
sudo dnf install nodejs
```

Verify:
```bash
node -v   # should print v18.x or v20.x
npm -v
```

### 2. Docker (Docker Desktop or Docker Engine)

**Check if you already have it:**
```bash
docker --version
docker compose version
```

**macOS:**
1. Download Docker Desktop for your chip (Apple Silicon or Intel): https://www.docker.com/products/docker-desktop
2. Open the `.dmg`, drag Docker to Applications, launch it.
3. Wait for the whale icon in the menu bar to say "Docker Desktop is running."

Or via Homebrew:
```bash
brew install --cask docker
open /Applications/Docker.app
```

**Windows:**
1. Docker Desktop on Windows requires **WSL2**. Enable it first (in an admin PowerShell):
   ```powershell
   wsl --install
   ```
   Restart your machine if prompted.
2. Download and run the Docker Desktop installer: https://www.docker.com/products/docker-desktop
3. During setup, make sure **"Use WSL 2 instead of Hyper-V"** is checked (default on modern installers).
4. Launch Docker Desktop and wait until it says "Engine running."

Or via winget:
```powershell
winget install Docker.DockerDesktop
```

**Linux (Ubuntu/Debian) — Docker Engine + Compose plugin:**
```bash
# Remove any old versions first
sudo apt-get remove docker docker-engine docker.io containerd runc

# Set up Docker's official repo
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Run docker without sudo (log out/in after this)
sudo usermod -aG docker $USER
```

Verify (all OSes):
```bash
docker --version
docker compose version
docker run hello-world
```
If `hello-world` prints a success message, Docker is working correctly.

### 3. Git

**Check:** `git --version`

- **macOS:** `xcode-select --install` (or `brew install git`)
- **Windows:** https://git-scm.com/download/win or `winget install Git.Git`
- **Linux:** `sudo apt-get install git` (Debian/Ubuntu) or `sudo dnf install git` (Fedora)

### 4. Shopify CLI 3.x

Installed as an npm global package (needs Node.js from step 1):
```bash
npm install -g @shopify/cli@latest
```

Verify:
```bash
shopify version
```

> Note: on some systems (notably some Linux distros) Shopify CLI may ask you to install additional dependencies like `ripgrep` — follow whatever prompt it gives you the first time you run a `shopify` command.

### 5. A Shopify Partner account

Required to create the app + a development store — no install needed, just a signup: https://partners.shopify.com/signup

---

## Step 1 — Create a Shopify Partner account

1. Go to https://partners.shopify.com/signup and sign up (free).
2. Once logged into the Partner Dashboard, you'll create both a **development store** and an **app** in the next steps.

## Step 2 — Create a development store

1. In the Partner Dashboard, go to **Stores** → **Add store** → **Development store**.
2. Choose **"Create a store to test and build"**.
3. Give it a name (e.g. `shroomharvest-dev`) and select **"Start with the Developer Preview"** or the standard option (either works).
4. Once created, note the store's `.myshopify.com` domain — you'll use it constantly during development.

## Step 3 — Create the app in the Partner Dashboard (optional, CLI can also do this)

You have two options:

**Option A (recommended): let the CLI create it for you in Step 5.**
Skip to Step 4.

**Option B: create it manually first.**
1. Partner Dashboard → **Apps** → **Create app** → **Create app manually**.
2. Name it `Smart Inventory Insights`.
3. Under **Client credentials**, copy the **Client ID** (API key) and **Client secret** — you'll paste these into `.env`.

## Step 4 — Clone/open this project and install dependencies

```bash
cd shroomharvest
npm install
```

This installs dependencies for the root workspace, `app/client`, and `app/server` in one pass (npm workspaces).

## Step 5 — Log in to Shopify CLI and link the app

```bash
npm install -g @shopify/cli@latest
shopify auth login
shopify app config link
```

`shopify app config link` will either connect to the app you created in Step 3, or offer to create a new one — it writes the real `client_id` into `shopify.app.toml` for you.

## Step 6 — Configure environment variables

```bash
cp .env.example app/server/.env
```

Open `app/server/.env` and fill in:
- `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` — from Step 3 or from `shopify.app.toml` after linking.
- Leave the `DATABASE_URL` and `MYSQL_*` values as-is if you're using the provided Docker Compose setup — the defaults already match.
- Set `SESSION_SECRET` to any long random string, e.g. generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

Also create `app/client/.env`:
```bash
echo "VITE_SHOPIFY_API_KEY=your_client_id_here" > app/client/.env
```

## Step 7 — Start MySQL in Docker

```bash
npm run docker:up
```

This starts:
- **MySQL 8** on `localhost:3306` (credentials from `.env.example`)
- **Adminer** (a simple DB browser) on http://localhost:8081 — server: `mysql`, user: `shroomharvest_user`, password: `shroomharvest_pass`, database: `shroomharvest`

Check containers are healthy:
```bash
docker compose ps
```

## Step 8 — Generate and run the initial migration

Module 0 ships a placeholder table (`_health_check`) just to prove the whole chain — Docker → MySQL → Drizzle → server — works. Module 1 replaces this with the real schema.

```bash
npm run db:generate --workspace=app/server
npm run db:migrate --workspace=app/server
npm run db:seed --workspace=app/server
```

## Step 9 — Run the server and client

In two terminals:

```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:client
```

- Server: http://localhost:3000
- Client: http://localhost:5173

## Step 10 — Verify everything is wired up

Open http://localhost:5173 in your browser. You should see:

```
Smart Inventory Insights
Module 0 — Project Initialization check

Server: up
Database: connected
Checked at: <ISO timestamp>
```

If "Database: unreachable" appears, confirm the Docker container is running (`docker compose ps`) and that `DATABASE_URL` in `app/server/.env` matches your Docker Compose credentials.

You can also hit the API directly:
```bash
curl http://localhost:3000/api/health
```

## Step 11 — Preview the theme (optional at this stage)

The theme scaffold is intentionally minimal in Module 0 (a valid `theme.liquid` layout + one placeholder section) so it previews without errors. Real pages and sections arrive in Modules 8–9.

```bash
cd theme
shopify theme dev --store=your-store.myshopify.com
```

---

## Troubleshooting

- **`ECONNREFUSED` on DB connection** — Docker container isn't up yet; run `npm run docker:up` and wait a few seconds for the healthcheck to pass.
- **`shopify: command not found`** — reinstall the CLI globally: `npm install -g @shopify/cli@latest`.
- **Port 3306 already in use** — you likely have a local MySQL instance running; change `MYSQL_PORT` in `.env` and `DATABASE_URL` accordingly.
- **Vite proxy 404s on `/api/...`** — make sure the server (`npm run dev:server`) is running on port 3000 before starting the client.

---

## Prerequisite check script

Run this any time to confirm all four tools are installed and on the right version:

```bash
echo "Node:   $(node -v 2>/dev/null || echo 'NOT FOUND')"
echo "npm:    $(npm -v 2>/dev/null || echo 'NOT FOUND')"
echo "Git:    $(git --version 2>/dev/null || echo 'NOT FOUND')"
echo "Docker: $(docker --version 2>/dev/null || echo 'NOT FOUND')"
echo "Compose:$(docker compose version 2>/dev/null || echo 'NOT FOUND')"
echo "Shopify CLI: $(shopify version 2>/dev/null || echo 'NOT FOUND')"
```

All six lines should print a version, not "NOT FOUND", before you continue to Step 1.

---

## What's next

Module 1 — Database Design: replaces the placeholder schema with the full normalized schema (Shops, Products, Inventory, Suppliers, InventoryHistory, Recommendations, ActivityLogs), real migrations, and seed data.
