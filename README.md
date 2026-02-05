<p align="center">
  <img src="https://github.com/Rayan-Mohammed-Rafeeq/AlliedEdge/blob/main/frontend/public/logo.svg" alt="AlliedEdge Logo" width="140"/>
</p>

<h1 align="center">AlliedEdge</h1>

A full‑stack **social platform** built with a **Spring Boot (Java 17)** API and a **React (Vite + TypeScript)** SPA, featuring Google OAuth login, profiles & posts, media uploads via Cloudinary, and real-time updates over WebSockets (STOMP/SockJS).

**Live demo (Vercel):** https://allied-edge.vercel.app

> Recruiter note: This repo contains both the API (auth, posts, profiles, chat) and the SPA. The backend is designed for production-style deployments (Postgres, Flyway migrations, OAuth login, secure cookies behind proxies).

## Highlights

- **Google OAuth2 login (backend-driven)** via Spring Security
- **Real-time chat** using WebSockets (STOMP/SockJS on the client)
- **Postgres + Flyway** migrations (repeatable, production-friendly)
- **Media uploads** via **Cloudinary**
- **SPA frontend** with modern UI stack (Tailwind + Radix UI)
- **Deployed**: **Frontend on Vercel**, **Backend on Render**
- **Dev-friendly**: Vite proxying to backend (`/api`, `/ws`, OAuth routes)

## Tech stack

**Frontend**
- React + TypeScript (Vite)
- Tailwind CSS
- Radix UI
- Axios
- WebSockets: `@stomp/stompjs` + `sockjs-client`

**Backend**
- Java 17, Spring Boot
- Spring Security (OAuth2 Client)
- Spring Web, Validation
- Spring Data JPA (Hibernate)
- Flyway migrations
- WebSocket
- JWT support

**Infrastructure**
- Postgres 16 (Docker)
- Docker (multi-stage build for backend)

## Architecture (high level)

- **Frontend (Vercel)** serves the SPA.
- **Backend (Render)** runs the Spring Boot API and exposes:
  - REST endpoints (commonly under `/api`)
  - WebSocket endpoint(s) (proxied under `/ws` in dev)
  - OAuth endpoints (e.g. `/oauth2/authorization/google`)
- **Database (Postgres)** stores app data; schema is managed via **Flyway**.
- **Cloudinary** stores uploaded media.

## Repo layout

- `backend/` — Spring Boot API + auth + realtime WebSocket endpoints
- `frontend/` — Vite/React SPA
- `docker-compose.yml` — Postgres + backend containers

## Quick links

- **Live site:** https://allied-edge.vercel.app
- **Google OAuth flow details:** `frontend/docs/google-login.md`

## Local development

### Prerequisites

- **Java 17** (Temurin/OpenJDK recommended)
- **Maven** (or use `backend/mvnw.cmd`)
- **Node.js** (LTS recommended)
- **pnpm** (repo uses `pnpm-lock.yaml`)
- **Docker Desktop** (recommended; easiest way to run Postgres)

### 1) Start Postgres + Backend (Docker)

This starts **Postgres** and the **backend**.

1) Create a `.env` in the repo root (same folder as `docker-compose.yml`).

Example:

```env
# Postgres
POSTGRES_DB=ae_blog_prod_db
POSTGRES_USER=allied_edge_user
POSTGRES_PASSWORD=change-me

# Google OAuth2 (backend-driven login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary (required for uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# JWT
APP_JWT_SECRET=replace-with-a-long-random-secret
# Optional
APP_JWT_EXPIRATION=86400

# CORS / redirect targets (optional)
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
APP_FRONTEND_REDIRECT_URL=http://localhost:5173/
```

2) Start services:

```bash
docker compose up --build
```

- Backend: http://localhost:8080
- Postgres: `localhost:5432`

### 2) Run the frontend (local dev)

In a second terminal:

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend: http://localhost:5173

#### Connecting the frontend to a different backend

Vite proxies API/WebSocket calls to a backend target.

- `VITE_BACKEND_TARGET` (defaults to `http://localhost:8080`)

Example (PowerShell):

```powershell
$env:VITE_BACKEND_TARGET="http://localhost:8080"
pnpm dev
```

## Run the backend without Docker (optional)

If you want to run the backend on your machine, you can point it at:

- a local Postgres instance, or
- the Postgres container from `docker compose`.

From `backend/`:

```bash
mvnw.cmd spring-boot:run
```

The backend reads configuration from environment variables (see `.env` example above). The datasource also has a localhost fallback in `backend/src/main/resources/application.properties`.

## Authentication (Google OAuth2)

This app uses **backend-driven** Google OAuth (Spring Security).

- Login is initiated by navigating the browser to:
  - `http://localhost:8080/oauth2/authorization/google`
- The backend completes the OAuth flow and redirects back to the frontend.

More details:

- `frontend/docs/google-login.md`

## Uploads (Cloudinary)

Cloudinary credentials are required when starting the backend.

Environment variables:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

If they’re missing, the backend will fail fast at startup.

## Scripts

### Frontend

- `pnpm dev` — start Vite dev server
- `pnpm build` — typecheck + production build
- `pnpm lint` — eslint
- `pnpm preview` — preview production build

### Backend

- `mvnw.cmd test` — run tests
- `mvnw.cmd spring-boot:run` — run locally
- `mvnw.cmd package` — build jar

## Troubleshooting

- **CORS issues**: configure `APP_CORS_ALLOWED_ORIGINS` to include your frontend URL.
- **Google login redirect mismatch**: ensure the Google OAuth client has the correct redirect URI:
  - `http://localhost:8080/login/oauth2/code/google`
- **Cookies not sticking in production**: backend is configured for `SameSite=None; Secure` and proxy headers; ensure you’re using HTTPS.

## Screenshots (optional)

Add screenshots or a short GIF here to make the project stand out for recruiters.

Suggested files:
- `docs/screenshots/feed.png`
- `docs/screenshots/profile.png`
- `docs/screenshots/chat.png`

## License

All rights reserved. This project is proprietary. See `LICENSE`.
