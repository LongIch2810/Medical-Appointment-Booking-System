# AGENTS.md

Universal guide for any coding agent (Codex, Claude Code, Gemini, Antigravity, or a human) working in this repository. Tool-specific behavior lives in a separate file (e.g. `CLAUDE.md` for Claude Code) that supplements, but never replaces, this one.

Every claim below was checked directly against source code, `package.json`, lock files, Docker/Compose files, `.env.example`, migrations, and tests at the time of writing. Where the repository does not provide enough evidence, the text says so explicitly (`Needs verification`) instead of guessing.

## 1. Project Overview

LifeHealth is a medical appointment booking and healthcare-management platform, built as **four independent Node.js/TypeScript services** with no root package manager or workspace tool (no root `package.json`; each service has its own `package.json` + `package-lock.json` and must be installed/run from its own directory).

- **`frontend/`** — patient-facing web portal: doctor search, booking, patient health records, messaging, AI chatbot UI.
- **`admin/`** — console for doctors and administrators: schedules, appointments, patient records, RBAC administration, reporting.
- **`backend/`** — the single NestJS API that both `frontend/` and `admin/` call; owns PostgreSQL, Redis, auth, and business rules.
- **`chatbot/`** — a separate Express/LangChain/LangGraph AI service for patient-facing chat, health-roadmap generation, and PDF report generation; it calls the backend over HTTP and reads a few read-only Postgres views directly.

Confirmed actors (role constants `ADMIN`, `PATIENT`, `DOCTOR` in the backend): **Visitor** (public pages), **Patient**, **Doctor**, **Administrator**, and an **internal chatbot caller** (service-to-service, authenticated by an internal key). Exact permission/route boundaries per actor: see `specs/as-is/permissions.md`.

The project's `LICENSE` is a custom "Educational & Non-Commercial License" — the README states this is a learning/demo project, not a commercial product.

**Before trusting any prose description of behavior (including this file), read §24 Source of Truth.** This repository already has a rigorously evidence-cited "as-is" specification at `specs/as-is/` that resolves several README/code mismatches (see §23).

## 2. Mandatory Codebase Discovery Rule

Any coding agent working in this repository MUST use the Codebase Memory MCP server before searching source code directly. If the repository is not indexed, run `index_repository` first. Use `search_graph` to find symbols, `trace_path` for callers/callees and data flow, `get_code_snippet` only after resolving an exact qualified name, and `query_graph`/`search_code` for broader analysis. Do not begin code discovery with grep, glob, IDE text search, or manual file browsing. Fall back to text search only when graph results are insufficient, or when locating string literals, error messages, configuration, documentation, or other non-code content. This rule applies repository-wide, including inside directories that have their own additional instruction files.

## 3. Repository Structure

```text
/
├── backend/        # NestJS API (PostgreSQL + TypeORM, Redis, Socket.IO, BullMQ)
├── frontend/       # Patient React/Vite app
├── admin/          # Doctor/Admin React/Vite app
├── chatbot/        # Express + LangChain/LangGraph AI service
├── docs/           # Screenshots + historical planning docs (docs/superpowers/) — not authoritative specs
├── specs/as-is/    # Evidence-based "as-is" specification of the whole system — read this first
├── scripts/        # Repo-level utility scripts (e.g. screenshot capture for README)
├── docker-compose.dev.yml  # Full local dev stack (all 4 services + Postgres/Redis/pgAdmin/RedisInsight)
└── README.md       # Marketing/overview README — cross-check claims against specs/as-is (see §23)
```

Not listed (generated/local, not relevant to a fresh clone): `node_modules/`, `dist/`, `build/`, `coverage/`, `tmp/`, `.playwright-output/`, `.playwright-mcp/`. `.claude/` and `.agents/` are checked in but only contain generic third-party coding-agent "skill" packages (UI/design patterns), not project source.

Where to work by task type:
- Patient-facing UI change → `frontend/` (read `frontend/AGENTS.md` and `frontend/DESIGN.md` first).
- Doctor/Admin UI change → `admin/` (read `admin/AGENTS.md`, `admin/DESIGN.md`, `admin/docs/rules.md`, `admin/docs/workflow.md` first).
- API/business-logic/DB change → `backend/src/modules/<feature>/`.
- Chatbot/AI flow change → `chatbot/src/` (`langgraph/`, `tools/`, `agents/`).

## 4. Architecture

```text
Patient browser (frontend, :5173/:5183) ──┐
                                            ├─> Backend API (:3000/:3010, /api/v1) ──> PostgreSQL
Admin/Doctor browser (admin, :4173/:4183) ─┘                                     ├──> Redis (cache, BullMQ, rate-limit)
                                                                                  ├──> BullMQ workers (mail, uploads, audit log)
                                                                                  └──> Socket.IO (messages, notifications)

Frontend/Backend ──(internal key + forwarded user JWT)──> Chatbot (:5000) ──> OpenAI (chat+embeddings) + Qdrant (RAG) + Cloudinary (PDF reports) + PostgreSQL (read-only views via a dedicated `chatbot_readonly` role)
```

- **Frontend/Admin → Backend**: `axios` over HTTPS/HTTP with cookies (`withCredentials`), single axios instance per app (see §13).
- **Backend → PostgreSQL**: TypeORM, `synchronize:false`, migrations run on boot (`migrationsRun:true`).
- **Backend → Redis**: one Redis instance, logically separated by DB index/key-prefix for cache, BullMQ, and rate-limiting (see `specs/as-is/integrations.md`).
- **Backend ↔ Chatbot**: chatbot calls backend over HTTP for chat-history persistence, doctor/specialty lookups, and booking; backend calls chatbot for AI features exposed in the UI. Chatbot authenticates to backend endpoints with an internal service key (`CHATBOT_INTERNAL_KEY`, must match on both sides) and separately verifies the end-user's own `ACCESS_TOKEN_SECRET`-signed JWT to derive a trusted actor identity for rate limiting.
- **Real-time**: a single Socket.IO gateway in `backend/src/websockets/websocket.gateway.ts`, authenticated by an HttpOnly cookie and re-checked on every event (not just at connect).
- **File storage**: Cloudinary (avatars, message attachments, article/specialty images, and AI-generated PDF reports from `chatbot/`).

## 5. Tech Stack

| Layer | Stack (verified from `package.json`) |
|---|---|
| Language | TypeScript across all 4 services |
| Patient frontend | React 19, Vite 6, React Router 7, TanStack Query 5, Zustand 5, Tailwind CSS 4 + shadcn/ui (Radix primitives), react-hook-form + zod, react-i18next, Framer Motion, GSAP |
| Admin frontend | React 19, Vite 6, React Router 7, TanStack Query 5, Zustand 5, Tailwind CSS 4 + shadcn/ui, react-hook-form + zod, Chart.js — **no i18n layer** (Vietnamese-only inline strings) |
| Backend | NestJS 11, TypeORM 0.3, PostgreSQL (driver `pg`), Redis (`ioredis`), Socket.IO 4, BullMQ 5, Passport (JWT + Google OAuth2), class-validator/class-transformer, Swagger (`@nestjs/swagger`) |
| Chatbot | Express 5, LangChain + LangGraph, `@langchain/openai` (LLM + embeddings), `@qdrant/js-client-rest` **pinned to `1.18.0`** (see §20), pdfkit + chartjs-node-canvas for PDF reports, TypeORM (read-only views only) |
| Testing | Backend: Jest. Frontend/Admin: Vitest (unit) + Playwright (frontend e2e only). Chatbot: Node's built-in test runner (not Jest). |
| Build | Backend: `nest build --builder swc`. Frontend/Admin: `tsc -b && vite build`. Chatbot: `tsc`. |
| Deployment (verified) | `frontend/` and `admin/` ship a committed `vercel.json` (SPA rewrite) → deployed as static Vercel apps. |
| Deployment (unverified) | No committed deployment config exists for `backend/` or `chatbot/` beyond a dev-only `Dockerfile.dev`. `.env.example` comments in both mention "Render" (Redis URL guidance) and one mentions "Vercel", but neither is backed by a committed config file in this repo. **Needs verification** — do not assume a specific host. |

**AI provider — verified, contradicts README**: the README's tech table lists chatbot AI providers as "OpenAI / Google Gemini / Ollama", and `chatbot/package.json` lists `@langchain/google-genai` as a dependency. Grepping `chatbot/src` for `google-genai`, `ChatGoogleGenerativeAI`, `GoogleGenerativeAI`, `GEMINI`, `Ollama`, and `standalone` found **zero usages** — `chatbot/src/configs/llm.ts` and `embeddings.ts` only implement `ChatOpenAI`/`OpenAIEmbeddings`, driven entirely by `OPENAI_*` env vars, and `chatbot/.env.example` has no `GEMINI_API_KEY` despite the root README listing one. Treat the chatbot as **OpenAI-only**; `@langchain/google-genai` is an installed-but-unused dependency. See `specs/as-is/integrations.md` for the full evidence trail.

## 6. Application Entry Points

| Service | Entry point | Notes |
|---|---|---|
| `backend/` | `backend/src/main.ts` | Sets global prefix `api/v1`, global interceptor/pipe/filter chain, Swagger at `/api-docs`; modules wired in `backend/src/app.module.ts`. |
| `frontend/` | `frontend/src/main.tsx` → `frontend/src/App.tsx` | Routes in `frontend/src/routes/AppRoutes.tsx`. |
| `admin/` | `admin/src/main.tsx` → `admin/src/App.tsx` | Routes in `admin/src/routes/AppRoutes.tsx`; menu/route config in `admin/src/config/menu.ts`. |
| `chatbot/` | `chatbot/src/server.ts` | Express app; mounts a lazily-imported router at `/chatbot` (`chatbot/src/routes/chatbot.route.ts`). |

## 7. Local Development

### Prerequisites

- Node.js and npm (no version pinned anywhere in the repo — no `engines` field, no `.nvmrc`. **Needs verification**; use a recent LTS Node).
- Docker + Docker Compose, only if you want the full containerized stack instead of running services natively.
- PostgreSQL 17 and Redis if running `backend`/`chatbot` natively without Docker (or start just the infra containers, see below).

### Install (per service, npm only — every service has a `package-lock.json`, no yarn/pnpm lockfiles exist)

```bash
npm ci --prefix backend
npm ci --prefix frontend
npm ci --prefix admin
npm ci --prefix chatbot
```

Each service also needs its own `.env`, copied from that service's `.env.example` (see §10).

### Development (native)

```bash
npm run start:dev --prefix backend   # NestJS watch mode, http://localhost:3000, prefix /api/v1
npm run dev --prefix frontend        # Vite, http://localhost:5173
npm run dev --prefix admin           # Vite, http://localhost:4173
npm run dev --prefix chatbot         # nodemon, http://localhost:5000
```

### Full-stack startup (Docker)

```bash
docker compose -f docker-compose.dev.yml up -d
```

Starts all 4 services plus PostgreSQL 17, Redis, pgAdmin, and RedisInsight, with bind-mounted source for hot reload. **Container host ports differ from native ports** so both can run side by side: frontend `5183`→5173, admin `4183`→4173, backend `3010`→3000; chatbot is `5000` either way (not published to the host — only reachable from other containers). To run only infra and the rest natively:

```bash
docker compose -f docker-compose.dev.yml up -d postgres redis pgadmin redisinsight
```

## 8. Build Commands

| Service | Command | What it does |
|---|---|---|
| `backend/` | `npm run build --prefix backend` | `nest build --builder swc`, emits to `backend/dist/` |
| `frontend/` | `npm run build --prefix frontend` | `tsc -b && vite build` (type-checks, then bundles) |
| `admin/` | `npm run build --prefix admin` | `tsc -b && vite build` |
| `chatbot/` | `npm run build --prefix chatbot` | `tsc`, emits to `chatbot/dist/` |

There is no single "build everything" command — build each service independently.

## 9. Test Commands

| Service | Framework (verified) | Commands |
|---|---|---|
| `backend/` | Jest + `@nestjs/testing` | `npm run test` / `test:watch` / `test:cov --prefix backend`; single file: `npm run test -- path/to/file.spec.ts`. E2E: `npm run test:e2e` (`test/jest-e2e.json`). Specs under `backend/test/unit/` (mirrors `src/`) and `backend/test/integration/`. |
| `frontend/` | Vitest (unit) + Playwright (e2e) | `npm run test` / `test:watch` / `test:cov --prefix frontend` — specs under `frontend/test/unit/`. E2E: `npm run test:e2e` / `test:e2e:ui` — specs under `frontend/test/e2e/` (config: `frontend/playwright.config.ts`). |
| `admin/` | Vitest (unit only) | `npm run test` / `test:watch` / `test:cov --prefix admin` — specs under `admin/test/unit/`. **No e2e runner configured for `admin/`.** |
| `chatbot/` | Node's built-in test runner (not Jest) | `npm run test` / `test:cov --prefix chatbot` — specs under `chatbot/test/unit/` (mirrors `src/`) plus `chatbot/test/integration/`. `test/noExternalNetwork.ts` blocks real outbound network calls, so tests must mock `httpClient`/LLM/Qdrant. Run a single file by swapping the glob in the script for the file path. |

Lint: `npm run lint --prefix <service>` exists for all four services (backend also runs `--fix`). Typecheck: `frontend`/`admin` typecheck via their `build` script (`tsc -b`); `chatbot` has a dedicated `npm run typecheck` / `typecheck:test`; `backend` typechecks as part of `nest build`.

Correction to earlier guidance: `admin/` and `frontend/` **do** have a configured unit-test runner (Vitest, with real spec files present — 11 files in `admin/test/unit/`, 13 in `frontend/test/unit/`); a previous version of this document said `admin/` had none. If a task changes test tooling, verify with `find <service>/test -iname "*.spec.*"` rather than trusting older docs.

## 10. Environment Variables

Never commit a populated `.env`. Copy each service's `.env.example` and fill in real values locally only. Tables below list every variable declared in the four `.env.example` files (no values shown).

### `backend/.env.example`

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | yes (has default `3000`) | HTTP port |
| `NODE_ENV` | yes | `development`/`production`/`test`; controls cookie `secure` flag |
| `TRUST_PROXY_HOPS` | yes (default `0`) | Proxy trust depth |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`, `DB_PORT` | yes | PostgreSQL connection |
| `REDIS_URL` | one of this or the HOST/PORT group | Full Redis URL (preferred on managed hosts) |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_TLS` | fallback | Local/Docker Redis connection |
| `REDIS_CACHE_DB`, `REDIS_BULLMQ_DB`, `REDIS_RATE_LIMIT_DB` | yes (default `0`) | Redis logical DB per workload |
| `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRE` | **yes — boot fails fast without it** (`backend/src/config/validateEnv.ts`) | JWT access token signing; secret must match `chatbot/.env`'s `ACCESS_TOKEN_SECRET` |
| `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRE` | **yes — boot fails fast without it** | JWT refresh token signing (must differ from access secret) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALL_BACK` | required for Google login | OAuth2 credentials/callback |
| `FRONTEND_URL` | yes | CORS allow-list + OAuth redirect target |
| `CHATBOT_URL` | yes | Internal base URL to call chatbot |
| `CHATBOT_INTERNAL_KEY` | yes — **secret, server-only** | Must match `chatbot/.env`; authenticates backend→chatbot calls |
| `CHATBOT_DB_PASSWORD` | yes — **secret** | Password for the `chatbot_readonly` Postgres role |
| `MAIL_USER`, `MAIL_PASS` | required for email features | SMTP credentials |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | required for uploads | Cloudinary credentials — **`API_SECRET` must never reach a client** |

### `chatbot/.env.example`

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | default `5000` | HTTP port |
| `START_STANDALONE_SERVER` | declared, **not read anywhere in `chatbot/src`** (verified by repo-wide grep) | Comment says "keep false on Vercel", but `chatbot/src/server.ts` unconditionally calls `app.listen(...)` and its own inline comment references Render (open-port health checks) — this variable currently has no effect on runtime behavior. Flag this to a human before relying on it. |
| `CHATBOT_INTERNAL_KEY` | yes — **secret** | Must match `backend/.env` |
| `ACCESS_TOKEN_SECRET` | yes — **secret** | Must match `backend/.env`'s `ACCESS_TOKEN_SECRET` exactly; used to verify the forwarded user JWT |
| `REDIS_URL` / `REDIS_HOST`,`REDIS_PORT`,`REDIS_PASSWORD`,`REDIS_TLS` | yes | Shared Redis instance, used only for the rate limiter |
| `REDIS_RATE_LIMIT_DB` | default `0` | Redis logical DB (workload separated by key prefix, not DB index, because managed Redis like Upstash may only offer DB 0) |
| `OPENAI_API_KEY` | yes — **secret** | LLM + embeddings |
| `OPENAI_BASE_URL` | default `https://api.openai.com/v1` | May point at an internal OpenAI-compatible proxy |
| `OPENAI_MODEL` (default `gpt-4.1-mini`), `OPENAI_FAST_MODEL` (`gpt-4o-mini`), `OPENAI_VISION_MODEL` (`gpt-4o-mini`) | yes | Main / cheap-routing / vision-OCR models |
| `LLM_HEALTH_ROADMAP_MAX_RETRIES` | default `2` | Retry budget for the health-roadmap flow |
| `OPENAI_EMBEDDING_MODEL` (`text-embedding-3-small`), `OPENAI_EMBEDDING_DIMENSIONS` (`1536`) | yes, **hard-coded check** | Code throws if these don't match the existing Qdrant collection |
| `CHATBOT_DB_PASSWORD`, `DB_USER` (`chatbot_readonly`), `DB_NAME`, `DB_HOST`, `DB_PORT` | yes | Read-only Postgres connection |
| `QDRANT_API_KEY` | required if Qdrant needs auth | — |
| `QDRANT_URL` | yes | Qdrant server/cluster URL |
| `QDRANT_COLLECTION_NAME` | yes — **hard-coded expected value** `BOOKING_DOCTOR_SYSTEM_OPENAI_TE3_SMALL_V1` | Code throws if it doesn't match exactly |
| `BACKEND_URL` | yes | Internal base URL to call backend |
| `CHAT_HISTORY_CONTEXT_LIMIT` | default `10` | Max recent messages sent to the agent |
| `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_CLOUD_NAME` | required for PDF report upload | — |

Note: the root `README.md` mentions a `GEMINI_API_KEY` variable — **this does not exist in `chatbot/.env.example`** and is not read anywhere in `chatbot/src` (see §5's AI-provider note). Do not add code that depends on a `GEMINI_API_KEY` without first confirming with the user whether Gemini support is actually wanted.

### `frontend/.env.example` and `admin/.env.example`

All `VITE_*` variables are **bundled into the browser bundle — never put a secret in these files.**

| Variable | Service(s) | Purpose |
|---|---|---|
| `VITE_BACKEND_URL` | both | Public base URL of the backend API the browser calls |
| `VITE_PROVINCES_API_URL` | `frontend/` only | Third-party Vietnam province/district/ward lookup API (`provinces.open-api.vn`), outside this repo's control |
| `VITE_TOKEN_EXPIRE` | `frontend/` only | Client-side session-expiry UX logic |

## 11. Database

- **Type**: PostgreSQL 17 (Docker image `postgres:17`).
- **ORM**: TypeORM 0.3, `synchronize: false` — schema changes only via migrations (`backend/src/database/database.module.ts`, `migrationsRun: true` on boot).
- **Entities**: centralized at `backend/src/entities/*.entity.ts` (not per-module).
- **Migrations**: `backend/src/database/migrations/` — 33 migration files as of this writing.
- **Migration commands** (from `backend/`, verified in `package.json`): `npm run migration:run`, `migration:revert`, `migration:generate`, `migration:create` — all run against `src/database/data-source.ts`.
- **Seed data**: delivered as migrations (e.g. `1779638786395-seedData.ts`, several `seed*Permission*.ts` files) — there is no separate `seed` npm script.
- **No documented reset command** for the dev database beyond dropping/recreating the Docker volume yourself — **Needs verification** if a scripted reset exists.
- **Chatbot's database access is read-only**: a dedicated Postgres role `chatbot_readonly` (session-level `default_transaction_read_only=on`) reads a small set of views defined under `chatbot/src/entities_view/` — it never migrates or writes to the main schema.

**Do not** hand-edit the schema or add a column without checking existing migrations and every consumer (backend service/DTO, chatbot read-only views, frontend/admin types) — see `specs/as-is/data-model.md` for the current, verified schema description.

## 12. API Structure

- Feature modules live under `backend/src/modules/<feature>/` (controller, service, module, `dto/`, sometimes a `*.mapper.ts`), registered in `backend/src/app.module.ts`. Current modules (verified via directory listing): `admin-reports`, `ai-documents`, `appointments`, `articles`, `audit-logs`, `auth`, `channels`, `chat-history`, `coach-profile`, `complaints`, `dashboard`, `doctor-schedules`, `doctors`, `examination-result`, `health-profile`, `messages`, `notifications`, `otps`, `permissions`, `relationships`, `relatives`, `role-permission`, `roles`, `satisfaction-rating`, `settings`, `specialties`, `tags`, `topics`, `users`.
- **Global prefix**: `api/v1` (`backend/src/main.ts`). **Swagger**: `/api-docs`.
- **Global pipeline** (`main.ts`/`app.module.ts`): CORS allow-listing frontend/admin origins, `cookie-parser`, interceptor chain `RemoveFieldPasswordInterceptor` → `DateFormatInterceptor` → `ResponseInterceptor` (wraps every response as `{ statusCode, success, data, error }`) → a global `WriteAuditLogInterceptor`; `HttpExceptionFilter` global filter; `ValidationPipe({ transform: true, whitelist: true })` global pipe.
- **Auth guards**: `backend/src/common/guards/` — `jwt.guard`, `jwtRefresh.guard`, `google.guard`, `localAuth.guard`, `wsCookieAuth.guard` (sockets).
- **Authorization**: custom RBAC, not Nest's built-in roles — `@Permissions('domain:action')` decorator + `PermissionsGuard`, resolved via `RolePermissionService` (roles → role_permission → permissions). When adding a protected endpoint, reuse or add a permission string and gate the route with `@Permissions(...)`.
- **Dates**: every response is auto-formatted `dd/MM/yyyy` (or `HH:mm dd/MM/yyyy`) by the global `DateFormatInterceptor` — don't hand-format dates again in a DTO/mapper.
- Full endpoint inventory (not duplicated here): `specs/as-is/api-spec.md`.

## 13. Frontend Structure

`frontend/` and `admin/` share the same architecture (`admin/` mirrors `frontend/` — check `frontend/` for a reference implementation of anything not yet built in `admin/`). Server access always flows in one direction:

```text
component/page → hook (src/hooks/, TanStack Query) → api module (src/api/<resource>Api.ts) → axios instance (src/configs/axios.ts)
```

- `src/configs/axios.ts` — the single axios instance (base URL, `withCredentials`, refresh-token interceptor). Never create a second axios instance or `QueryClient`.
- `src/api/<resource>Api.ts` — typed HTTP wrappers, always return `res.data`, no React/hooks/toast/navigation inside.
- `src/hooks/use<Resource>.ts` — TanStack Query hooks; each feature exports a `<feature>QueryKeys` factory for cache invalidation.
- `src/store/` (Zustand) — client-only state (auth user, UI flags); server data belongs in the Query cache, never in a store.
- `src/types/interface/<resource>.interface.ts` — request/response types + shared `ApiResponse<T>`/`ApiError`.
- Both apps use the `@/` alias for `src/`, Tailwind CSS 4 + shadcn/ui (`src/components/ui/`) with composed components in `src/components/app/`, React Router 7 (`src/routes/AppRoutes.tsx`), react-hook-form + zod.
- `frontend/` has `src/schemas/<domain>.schema.ts` for shared zod validation reused across forms; `admin/` does not have this folder yet — follow the same convention there if a cross-form validation need arises.
- Shared async-state UI: `frontend/`'s `src/components/notification/` (`StateCard`, `ErrorState`, `NotFoundResult`) vs. `admin/`'s `src/components/app/` (`LoadingState`, `ErrorState`, `EmptyState`) — reuse whichever set matches the app you're in.
- `frontend/` is i18n'd (`react-i18next`, `src/i18n/locales/{vi,en}.ts`, `t("ns.key", { defaultValue: "..." })`); `admin/` has no i18n layer.

## 14. Authentication and Authorization

- **Mechanism**: Passport-based JWT with access + refresh tokens delivered as cookies, plus Google OAuth2. Strategies: `backend/src/modules/auth/*.strategy.ts`.
- **Roles**: `ADMIN`, `PATIENT`, `DOCTOR` (constants in backend). Google login always assigns `PATIENT` — there is no staff-facing Google login path.
- **Session revocation** (must reuse this pattern for any new "force logout" admin action — password change, permission edits, lock/deactivate): bump `session_version:<userId>` and clear `refresh_tokens:<userId>` in Redis; every authenticated request (HTTP and WebSocket) is checked by `SessionAuthService.assertSessionValid()`. Flipping a DB column alone (e.g. `is_locking`/`is_active`) does nothing until something calls this same revoke path — `UsersService.setLocking`/`setActive` and `AuthService.validateUser()`/`GoogleStrategy.validate()` do this; `UsersService.updateRoles` currently only clears the permissions cache, not the session (a known inconsistency — see `specs/as-is/known-ambiguities.md`, don't silently "fix" it without confirming intent).
- **Authorization**: custom `@Permissions('domain:action')` + `PermissionsGuard`, see §12.
- **Frontend/Admin**: the single axios instance queues concurrent 401s and retries once via `/auth/refresh`; auth user state lives in a Zustand store.
- Full flow and permission inventory: `specs/as-is/permissions.md`.

## 15. External Services

| Service | Used by | Config location | Related env vars |
|---|---|---|---|
| PostgreSQL | `backend/` (read-write), `chatbot/` (read-only views) | `backend/src/database/`, `chatbot/src/database/` | `DB_*`, `CHATBOT_DB_PASSWORD` |
| Redis | `backend/` (cache + BullMQ), `chatbot/` (rate limit only) | `backend/src/redis-cache/`, `backend/src/bullmq/`, `chatbot/src/configs/redis.ts` | `REDIS_*` |
| Cloudinary | `backend/` (avatars, attachments, article/specialty images), `chatbot/` (AI-generated PDF reports) | `backend/src/uploads/`, `chatbot/src/configs/cloudinary.ts` | `CLOUDINARY_*` |
| Google OAuth2 | `backend/` (login) | `backend/src/modules/auth/google.strategy.ts` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALL_BACK` |
| SMTP mail | `backend/` (welcome/OTP/appointment emails via BullMQ) | `backend/src/mail/` | `MAIL_USER`, `MAIL_PASS` |
| OpenAI | `chatbot/` only (chat, vision/OCR, embeddings) — **not** Gemini/Ollama despite README, see §5 | `chatbot/src/configs/llm.ts`, `embeddings.ts` | `OPENAI_*` |
| Qdrant | `chatbot/` only (RAG vector store) | `chatbot/src/configs/vectordb.ts` | `QDRANT_*` |
| provinces.open-api.vn | `frontend/` only (address lookup) | frontend consumer not fully traced in this pass — `Needs verification` which component calls it | `VITE_PROVINCES_API_URL` |

## 16. Deployment Architecture

**Verified**: `frontend/` and `admin/` each ship a committed `vercel.json` with an SPA rewrite (`"/((?!assets/).*)" → "/index.html"`) — this pattern only makes sense for a static-site host serving a client-rendered SPA, so both are deployed as static Vercel projects. The README's screenshot caption references a live URL (`patientuilifehealth.vercel.app`), consistent with this.

**Not verifiable from the committed repository**: `backend/` and `chatbot/` have only a dev-only `Dockerfile.dev` each (used by `docker-compose.dev.yml`); there is no committed production Dockerfile, `render.yaml`, `fly.toml`, Procfile, or CI/CD workflow of any kind (`.github/workflows/` does not exist in this repo). `.env.example` comments in `backend/` and `chatbot/` mention "Render" (for `REDIS_URL`) and "Vercel" (for `START_STANDALONE_SERVER`, which chatbot's code doesn't actually read — see §10), and a local, git-ignored `backend/.vercel/project.json` links to a Vercel project named `api_life_health` on this particular checkout — but none of that is committed configuration, so **do not assert a specific hosting target for `backend/`/`chatbot/` in production**. `Deployment target not verifiable from repository.`

## 17. Coding Conventions

- Naming: kebab-case folders/files, PascalCase React components, `useXxx` hooks, camelCase functions/variables with verb prefixes for actions, `isX/hasX/canX/shouldX` booleans, `UPPER_SNAKE_CASE` true constants, `xxxApi.ts` API modules, `*.interface.ts` shared types.
- NestJS files use `.controller.ts`, `.service.ts`, `.dto.ts`, `.entity.ts` suffixes.
- Two-space indentation, TypeScript everywhere. Backend Prettier config requires single quotes and trailing commas.
- Reuse existing UI primitives and abstractions (see §13) instead of duplicating validation or state markup per page.
- ESLint is configured per service (`npm run lint --prefix <service>`); backend's lint script auto-fixes (`--fix`).

## 18. Agent Working Rules

### Before modifying code
1. Read this file (`AGENTS.md`).
2. Read any tool-specific file that applies (e.g. `CLAUDE.md` for Claude Code).
3. Read the relevant nested docs for the area you're touching (`frontend/AGENTS.md`+`DESIGN.md`, `admin/AGENTS.md`+`DESIGN.md`+`docs/rules.md`+`docs/workflow.md`, or `specs/as-is/*.md`).
4. Inspect the current implementation directly — do not assume behavior from a doc or comment.
5. Find all callers/consumers of anything you plan to change (grep across all 4 services — a backend DTO change can affect `frontend/`, `admin/`, and `chatbot/` simultaneously).
6. Check existing tests for the area.
7. Do not assume behavior; verify it.

### While modifying code
- Fix the root cause, not the symptom.
- Avoid large rewrites unless the task calls for one.
- Preserve backward compatibility unless a breaking change is explicitly requested.
- Don't remove a feature just to make a bug disappear.
- Don't add a new dependency if the existing stack already solves the problem.
- Don't duplicate logic that an existing abstraction already provides (see §13, §17).
- Don't change architecture for personal preference.
- Don't touch files outside the task's scope.

### Before claiming completion
Run what's applicable and actually verify the output before writing "done":
- The relevant targeted test(s) for the area you changed.
- The broader test suite for that service if feasible.
- Typecheck (`build`/`typecheck` — see §8/§9).
- Lint.
- Build.
- `git diff` review — confirm no unrelated files changed.

If a step can't be run, say so explicitly (which step, why, what remains unverified). Never say "done", "fixed", or "working" without having actually run the check.

## 19. Rules Against Hallucination

- Never invent an endpoint, environment variable, database column, permission string, business rule, deployment target, or command that you have not confirmed exists in this repository.
- Never assume a library is installed — check the relevant `package.json`.
- Never assume a doc (including this file, the README, or `specs/as-is/`) still matches the current implementation — verify against source, especially for anything security- or data-affecting.
- If a user's request conflicts with what the code actually does, say so before implementing — don't silently paper over the discrepancy.

## 20. Dependency Rules

- Package manager is **npm** in every service (each has `package-lock.json`; no `yarn.lock`/`pnpm-lock.yaml` exists anywhere in the repo). Do not introduce a different package manager or lockfile for any service.
- There is no workspace tool — dependencies are fully independent per service; a version bump in one service's `package.json` has no effect on the others.
- Before adding a dependency, check whether the service's existing stack (see §5) already covers the need.
- `chatbot/package.json` must keep `@qdrant/js-client-rest` pinned at exactly `1.18.0` — `@langchain/qdrant@0.1.2` still calls the client's `.search()` method, which `1.19.0`+ removed in favor of `.query()`. Bumping it silently breaks `rag_tool` with a generic, redacted `ChatbotOperationError`. Don't run a blanket `npm update`/`npm audit fix` in `chatbot/` without re-verifying `rag_tool` end-to-end afterward.

## 21. Git / Generated Files Rules

Do not hand-edit: `dist/`, `build/`, `coverage/`, anything under `node_modules/`, or a lockfile except as an automatic result of a package-manager command. `backend/src/metadata.ts` is generated by the Swagger CLI plugin at build time (`clean:swagger-metadata` script removes it) — don't hand-maintain it.

## 22. Important Known Constraints

- **Session revocation pattern** — see §14. Any new "must force logout" admin action should reuse the `session_version`/`refresh_tokens` Redis pattern, not a per-request DB flag check.
- **Qdrant client version pin** — see §20.
- **Vercel SPA rewrite must exclude `/assets/`** (`"/((?!assets/).*)"`, not a bare `"/(.*)"`, in both `frontend/vercel.json` and `admin/vercel.json`). Vite fingerprints `React.lazy()` chunk filenames per build; a tab left open across a redeploy can request a chunk that no longer exists, and a bare catch-all rewrite would serve `index.html` for it instead of a real 404 (which the browser then rejects as a bad JS MIME type). `frontend/src/main.tsx` also listens for Vite's `vite:preloadError` to force one reload as a second line of defense — keep both.
- **Chatbot's `START_STANDALONE_SERVER` env var has no effect on runtime behavior** (see §10) — don't rely on it, and flag it rather than assuming it works.
- **Notification toast can precede its triggering response**: `frontend/`'s `NotificationRealtimeProvider` fires the instant the backend emits a `notification:new` socket event, which is often faster than an HTTP response that still needs an LLM turn (e.g. a chatbot reply). This is expected given the architecture, not a race-condition bug to "fix" by delaying the toast.
- **Diagnosis flow is implemented but not routed**: `chatbot/src/langgraph/diagnosis.graph.ts` and its controller/service exist but `chatbot/src/routes/chatbot.route.ts` never registers a route for them — confirmed unreachable by `chatbot/test/integration/chatbot.route.integration.spec.ts`, which mocks the service to throw if called. Only `/chat`, `/create-report`, and `/build-health-roadmap` are live chatbot HTTP endpoints.
- See `specs/as-is/known-ambiguities.md` for a longer, actively-maintained list of confirmed doc/code conflicts and dead code — check it before assuming any single piece of documentation (including this file) is exhaustive.

## 23. Documentation Map

```text
specs/as-is/            # Evidence-cited "as-is" spec of the whole system — READ THIS FIRST for "is X actually true"
├── README.md               # Index + confidence-labeling convention (CONFIRMED/PARTIAL/UNCERTAIN/DEAD CODE/CONFLICT/...)
├── product-overview.md     # System boundaries, actors, runtime topology
├── functional-spec.md      # Function inventory per service
├── user-flows.md           # User + machine-to-machine flows
├── business-rules.md       # Rules confirmed from code/DB
├── data-model.md           # Entities, relations, constraints, migrations
├── api-spec.md             # HTTP/WebSocket/chatbot API inventory
├── permissions.md          # Auth, roles, permissions, route guards
├── error-handling.md       # Response envelope, validation, rate limiting, UI error states
├── integrations.md         # Postgres/Redis/mail/Cloudinary/OAuth/AI/Docker — includes the Gemini/OpenAI conflict writeup
└── known-ambiguities.md    # Conflicts, dead code, coverage gaps — actively maintained, check before relying on any claim

frontend/AGENTS.md, frontend/DESIGN.md         # Patient UI conventions + design system — read before non-trivial frontend/ work
admin/AGENTS.md, admin/DESIGN.md               # Admin conventions + design system
admin/docs/rules.md, admin/docs/workflow.md    # Admin RBAC-in-UI, query-key, and mutation conventions with worked examples

docs/superpowers/plans/, docs/superpowers/specs/  # Historical feature planning docs — background/context only, not a current source of truth (may describe designs that were changed or abandoned)
docs/images/, docs/screenshots/                   # README screenshots
```

## 24. Source of Truth

When documentation and code disagree, trust in this order:

1. **Actual source code** (the running implementation).
2. **Automated tests** (they encode an intended contract, even if the code has drifted).
3. **Runtime/configuration files** (`.env.example`, `docker-compose.dev.yml`, migrations).
4. **`specs/as-is/*.md`** — already evidence-cited against source, but can lag a fresh commit.
5. **Service-level `AGENTS.md`/`DESIGN.md`/`docs/*.md`**.
6. **This file (`AGENTS.md`) and any tool-specific file (`CLAUDE.md`)**.
7. **Root `README.md`** — marketing-oriented; confirmed to contain at least one inaccuracy (the Gemini/Ollama AI-provider claim, see §5) — treat it as the least reliable source and verify anything it says against code before repeating it.
8. **Code comments** — can go stale silently.

Always verify before relying on a documentation claim if the task is non-trivial or security/data-affecting.

## 25. Keeping AGENTS.md Updated

If a task changes architecture, project structure, a build/test/dev command, a required environment variable, the deployment process, or the database workflow, check whether this file needs a matching update. Do not edit this file for a small implementation detail that doesn't change any of the above.
