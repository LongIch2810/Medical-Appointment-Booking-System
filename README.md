# LifeHealth

LifeHealth is a multi-service healthcare platform for discovering doctors, booking appointments, managing patient records, administering clinical workflows, and providing AI-assisted consultation support.

## Features

- Doctor discovery, schedules, and appointment booking
- Patient profiles, relatives, health records, and examination results
- Doctor and administrator dashboards with role-based access control
- Articles, complaints, notifications, ratings, and audit logs
- Real-time messaging and file uploads
- AI chatbot, retrieval-augmented generation, and health report generation

## Technology Stack

| Service | Main technologies |
| --- | --- |
| Patient app | React 19, TypeScript, Vite, TanStack Query, Zustand, Tailwind CSS |
| Admin app | React 19, TypeScript, Vite, TanStack Query, Zustand, Tailwind CSS |
| API | NestJS, TypeORM, PostgreSQL, Redis, BullMQ, Socket.IO, Swagger |
| Chatbot | Express, TypeScript, LangChain, LangGraph, Qdrant, Gemini/OpenAI/Ollama |

## Architecture

Each service is independent (own `package.json`, own dependencies) and communicates over HTTP/WebSocket — there is no shared workspace tooling.

- **Backend (NestJS)** — feature modules live under `src/modules/<feature>/`, entities are centralized in `src/entities/`, and TypeORM migrations live in `src/database/migrations/`. Every request passes through cookie-based JWT auth (Passport strategies + Google OAuth), a custom RBAC layer (`@Permissions('domain:action')` decorators enforced by `PermissionsGuard`, resolved against `role → role_permission → permissions`), and a global interceptor chain that wraps every response as `{ statusCode, success, data, error }`. Real-time messaging/notifications go through a Socket.IO gateway; background jobs (mail, notifications, uploads) run on BullMQ; Redis backs both caching and queues.
- **Frontend & Admin (React 19 + Vite)** — `admin/` mirrors `frontend/`'s architecture and structure (the workspace for doctors/administrators vs. the patient-facing portal). Both enforce a strict one-way data flow: `component/page → hook (TanStack Query) → api module → shared axios instance`, with Zustand reserved for client-only UI state and server data always living in the Query cache. `frontend/` centralizes react-hook-form + zod validation in `src/schemas/<domain>.schema.ts` and shares a common loading/error/empty-state UI pattern in `src/components/notification/` (`StateCard`, `ErrorState`, `NotFoundResult`); `admin/` doesn't have these yet but should adopt the same conventions as it converges on `frontend/`'s patterns.
- **Chatbot (Express + LangChain/LangGraph)** — conversational flows (booking, diagnosis, report generation, health roadmap, medical-record summary) are LangGraph state graphs composed from tools for RAG lookup (Qdrant-backed), SQL Q&A over read-only database views, booking, OCR, and PDF report generation.

## Repository Layout

```text
.
├── frontend/             # Patient-facing React application
├── admin/                # Doctor and administrator React application
├── backend/              # NestJS REST API and WebSocket server
│   └── src/
│       ├── modules/      # Domain modules and controllers
│       ├── entities/     # TypeORM entities
│       ├── database/     # Data source, migrations, and seed data
│       └── common/       # Guards, DTOs, filters, and interceptors
├── chatbot/              # AI consultation and report service
│   └── src/              # Agents, RAG, routes, tools, and data access
└── docker-compose.dev.yml
```

## Prerequisites

- Node.js 20 or newer
- npm
- Docker Desktop with Docker Compose (recommended)
- PostgreSQL and Redis when running infrastructure without Docker

## Environment Configuration

Create a local `.env` file for every service before starting the stack:

```bash
cp frontend/.env.example frontend/.env
cp admin/.env.example admin/.env
cp backend/.env.example backend/.env
cp chatbot/.env.example chatbot/.env
```

Review and fill every required value. The client apps use `VITE_BACKEND_URL` (normally `http://localhost:3000`). Backend configuration includes database, Redis, JWT, OAuth, mail, Cloudinary, frontend, and chatbot settings. The chatbot requires database, model-provider, Qdrant, backend, and Cloudinary settings.

For Docker development, keep database and Redis credentials consistent with `docker-compose.dev.yml`. Compose supplies the internal service hosts (`postgres`, `redis`, `backend`, and `chatbot`). Never commit populated `.env` files or production secrets.

## Quick Start with Docker

After configuring the environment files, build and start the complete development stack:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Use `Ctrl+C` to stop attached containers, then remove them with:

```bash
docker compose -f docker-compose.dev.yml down
```

Persistent PostgreSQL and Redis data remains in named volumes. Add `-v` to `down` only when you intentionally want to delete local data.

### Development URLs

The Docker Compose stack exposes `frontend`, `admin`, and `backend` on different host ports than running them natively, so both can run side by side on the same machine without a port conflict. `chatbot`, `pgAdmin`, and `RedisInsight` use the same port either way.

| Component | Docker (`docker compose up`) | Native (`npm run dev`) |
| --- | --- | --- |
| Patient app | `http://localhost:5183` | `http://localhost:5173` |
| Admin app | `http://localhost:4183` | `http://localhost:4173` |
| Backend API | `http://localhost:3010/api/v1` | `http://localhost:3000/api/v1` |
| Swagger UI | `http://localhost:3010/api-docs` | `http://localhost:3000/api-docs` |
| Chatbot service | `http://localhost:5000/chatbot` | `http://localhost:5000/chatbot` |
| pgAdmin | `http://localhost:8000` | — |
| RedisInsight | `http://localhost:5540` | — |

The Docker `frontend`/`admin` containers are pre-configured (via `docker-compose.dev.yml`'s `environment:` block) to call the Docker backend at `:3010`, independent of whatever `VITE_BACKEND_URL` is set to in `frontend/.env`/`admin/.env` for native runs.

> **Google OAuth caveat:** Google login redirects through the fixed `GOOGLE_CALL_BACK` URI registered in Google Cloud Console. The Docker backend overrides it to `http://localhost:3010/api/v1/auth/google/redirect` — add that exact URI to your OAuth client's authorized redirect URIs if you need Google login to work against the Docker instance. Without it, Google login only completes against the natively-run backend on port 3000.

## Run Services Locally

Start only the infrastructure containers:

```bash
docker compose -f docker-compose.dev.yml up -d postgres redis pgadmin redisinsight
```

Install locked dependencies:

```bash
npm --prefix frontend ci
npm --prefix admin ci
npm --prefix backend ci
npm --prefix chatbot ci
```

Then run each service in a separate terminal:

```bash
npm --prefix backend run start:dev
npm --prefix chatbot run dev
npm --prefix frontend run dev
npm --prefix admin run dev
```

When services run outside Docker, use `localhost` for PostgreSQL and Redis hosts, set the backend chatbot URL to `http://localhost:5000`, and set the chatbot backend URL to `http://localhost:3000`.

## Build, Test, and Lint

```bash
# Type-check and bundle the React applications
npm --prefix frontend run build
npm --prefix admin run build

# Lint the React applications
npm --prefix frontend run lint
npm --prefix admin run lint

# Build, lint, and test the API
npm --prefix backend run build
npm --prefix backend run lint
npm --prefix backend run test
npm --prefix backend run test:cov
```

Backend unit tests use Jest and follow the `*.spec.ts` naming convention. The frontend, admin, and chatbot packages currently do not define automated test scripts.

## Database Migrations

Run TypeORM migrations from the backend package after configuring its database connection:

```bash
npm --prefix backend run migration:run
npm --prefix backend run migration:revert
```

Migration creation and generation scripts are also available in `backend/package.json`. Review generated migrations before applying them.

## Contributing

See [AGENTS.md](AGENTS.md) for repository structure, coding conventions, testing expectations, and pull request guidance. Keep changes scoped to the owning service and do not edit generated `dist/`, `dist_old*/`, or dependency directories.

For non-trivial changes to the client apps, read the deeper contributor docs first: [admin/AGENTS.md](admin/AGENTS.md), [admin/DESIGN.md](admin/DESIGN.md), [admin/docs/rules.md](admin/docs/rules.md), and [admin/docs/workflow.md](admin/docs/workflow.md) cover full RBAC-in-UI, query-key, and mutation conventions with worked examples; [frontend/AGENTS.md](frontend/AGENTS.md) documents the equivalent conventions for the patient app.
