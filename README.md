# proxy-admin

RelayNorth admin console — the React + Vite operator control room. Split out from
the RelayNorth monorepo to deploy on Railway as its own service. The API lives in
[`proxy-backend`](https://github.com/therajusah/proxy-backend); the public site in
[`proxy-frontend`](https://github.com/therajusah/proxy-frontend).

## What's here

- `app.js` — the React application (single file).
- `index.html`, `styles.css`, `vite.config.js` — Vite entry, styles, build config.
- `public/config.js` — runtime config; sets `window.__API_BASE__` (the backend URL).
- `Dockerfile`, `Caddyfile`, `docker-entrypoint.sh` — build + static serving for Railway.

## Run locally

```bash
npm ci
npm run dev      # http://127.0.0.1:4173
# or a production build:
npm run build    # -> dist/
```

## Deploy on Railway (Docker)

Railway auto-detects the `Dockerfile`, builds the SPA, and serves `dist/` with
Caddy on `$PORT`.

1. **New Project → Deploy from GitHub repo →** `therajusah/proxy-admin`.
2. Set the service variable **`API_BASE`** to the backend URL, e.g.
   `https://proxy-backend-production.up.railway.app`. The entrypoint bakes it into
   `config.js` at container start (no rebuild needed).
3. Because the console authenticates with a **cookie**, cross-origin auth needs the
   **backend** service configured to match:

   | Backend variable | Value |
   |------------------|-------|
   | `ALLOWED_APP_ORIGINS` | this admin's URL (comma-separated with the frontend's) — enables CORS with credentials |
   | `APP_ENV` | `production` (so the admin cookie is `Secure`) |
   | `ADMIN_COOKIE_SAMESITE` | `none` (so the cookie is sent on cross-site XHR) |

   With those set, the admin's `fetch(..., {credentials:'include'})` calls carry the
   session cookie across origins over HTTPS.

Local check:

```bash
docker build -t proxy-admin . && docker run -e PORT=8080 -e API_BASE= -p 8080:8080 proxy-admin
# open http://localhost:8080
```
