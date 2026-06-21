# 🔥 Hearth — Family Finance

A warm, self-hosted household budgeting app. Track income, expenses, budgets,
and categories for the whole family — all on your own hardware, no cloud, no
subscriptions, no data leaving the house.

Built for a Mac Mini home server running Docker behind a Caddy reverse proxy,
but it runs anywhere Docker does.

![Stack](https://img.shields.io/badge/React-18-2A5C46) ![Stack](https://img.shields.io/badge/Express-4-2A5C46) ![Stack](https://img.shields.io/badge/SQLite-sql.js-2A5C46) ![Stack](https://img.shields.io/badge/Docker-Compose-2A5C46)

---

## What it does

- **Overview** — a "left to spend this month" hero with a signature cashflow
  strip that shows where your income actually goes
- **Transactions** — day-grouped ledger with search and quick filtering
- **Budgets** — per-category monthly budgets with live progress and overspend flags
- **Categories** — add / edit / delete categories with emoji + colour, delete-guarded
- **Reports** — filter by month, six months, or year; export polished **Excel** and **PDF** reports
- **Quick add** — press `N` anywhere to log an expense in seconds

Data is stored in a single SQLite file on disk (`./data`), mounted outside the
container so it survives every rebuild.

---

## Quick start

You need [Docker Desktop](https://www.docker.com/products/docker-desktop/)
installed and running. Then:

```bash
git clone https://github.com/YOUR-USERNAME/family-finance.git
cd family-finance
./install.sh
```

That's it. The installer checks Docker, picks a safe port, builds both
containers, waits for the app to come up, and prints the URL.

Open **http://localhost:3002/finance**

> First launch seeds a realistic sample household so you can see everything
> working. Wipe it anytime from **Settings → Reset to sample data**.

### Updating

```bash
./update.sh
```

Pulls the latest version and rebuilds. **Your data is never touched** — it lives
in `./data`, outside Docker.

---

## Running behind Caddy at `/finance`

Hearth expects to be served under the `/finance` path (the React router uses
`basename="/finance"` and the API client auto-detects the prefix). If you run a
Caddy reverse proxy, add this to your `Caddyfile`:

```caddy
your-host.local {
    handle_path /finance* {
        reverse_proxy localhost:3002
    }
}
```

Caddy strips the `/finance` prefix; nginx inside the container serves the app
and proxies `/api/*` to the backend. Reload Caddy:

```bash
sudo systemctl reload caddy
```

Now the app is reachable at `https://your-host.local/finance`.

### Accessing remotely

Pair it with [Tailscale](https://tailscale.com) for private access from
anywhere without exposing anything to the public internet — just hit your
Mini's Tailscale IP at `/finance`.

---

## Changing the port

Port `3002` is the default (chosen to avoid clashing with apps that grab `3000`
or `8080`). To use another:

```bash
HOST_PORT=3005 ./install.sh
```

Or copy `.env.example` to `.env` and set `HOST_PORT` there.

---

## Backup & restore

Your entire financial history is one file. Back it up however you like:

```bash
# backup
cp ./data/family-finance.db ./backups/ff-$(date +%Y%m%d).db

# restore
cp ./backups/ff-YYYYMMDD.db ./data/family-finance.db
docker compose restart backend
```

---

## Architecture

```
┌─────────────┐     /finance/*      ┌──────────────────────────┐
│    Caddy    │ ──── strips ───────▶│  frontend (nginx :3000)   │
│  (your host)│      prefix         │  • serves React SPA       │
└─────────────┘                     │  • proxies /api → backend │
                                    └────────────┬─────────────┘
                                                 │  /api/*
                                                 ▼
                                    ┌──────────────────────────┐
                                    │  backend (Express :3001)  │
                                    │  • REST API               │
                                    │  • SQLite via sql.js      │
                                    └────────────┬─────────────┘
                                                 │
                                                 ▼
                                         ./data/family-finance.db
                                         (persistent, outside Docker)
```

- **Frontend** — React 18 + Vite, Hanken Grotesk / Bricolage Grotesque / Spline
  Sans Mono, no heavyweight chart library (hand-built CSS visuals)
- **Backend** — Node + Express, `sql.js` (pure-JS SQLite, no native compilation
  headaches in Docker)
- **Persistence** — single SQLite file, volume-mounted

---

## Common commands

| Task | Command |
|------|---------|
| Start | `docker compose up -d` |
| Stop | `docker compose down` |
| Rebuild | `docker compose up -d --build` |
| Logs | `docker compose logs -f` |
| Reset data | Settings → Reset to sample data |

> ⚠️ Never run `docker compose down -v` — the `-v` flag deletes volumes. Your
> database lives in `./data` and won't be hit by a normal `down`, but avoid `-v`
> as a habit.

---

## License

MIT — do whatever you like. See [LICENSE](LICENSE).
