# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

LifeHealth is a medical appointment booking platform composed of four independent services, each with its own `package.json` and dependencies:

- `frontend/` — patient-facing portal (React 19 + TS + Vite 6)
- `admin/` — workspace for doctors/administrators (React 19 + TS + Vite 6, near-identical stack/structure to `frontend/`)
- `backend/` — API server (NestJS + TypeORM + PostgreSQL + Redis + Socket.IO)
- `chatbot/` — Node/TS service for medical Q&A and consultation flows (LangChain + LangGraph + Qdrant)

There is no root package.json / workspace tool — install and run each service from its own directory.

## Mandatory Codebase Discovery Rule

Claude Code MUST use Codebase Memory MCP before searching source code directly. If the repository is not indexed, run `index_repository` first. Use `search_graph` to find symbols, `trace_path` for callers/callees and data flow, and `get_code_snippet` only after resolving an exact qualified name; use `query_graph` or `search_code` for broader analysis. Do not begin code discovery with grep, glob, IDE text search, or manual file browsing. Fall back to text search only when graph results are insufficient or when locating string literals, error messages, configuration, documentation, or other non-code content. This rule applies repository-wide, including directories with additional instruction files.

## Commands

`docker compose -f docker-compose.dev.yml up -d` runs the full dev stack (`frontend`, `admin`, `backend`, `chatbot`, plus Postgres/Redis/RedisInsight/pgAdmin) in containers with bind-mounted source and polling-based hot reload. Its host ports differ from the native ports below for `frontend`/`admin`/`backend` (5183/4183/3010 instead of 5173/4173/3000) so the container stack and native `npm run dev` processes can run side by side without colliding; `chatbot` uses 5000 either way. Run `docker compose -f docker-compose.dev.yml up -d postgres redis pgadmin redisinsight` to start only infra when running everything else natively.

### backend/ (from `backend/`)
- `npm run start:dev` — watch mode (nest, port from `PORT` env, default 3000), API prefixed at `/api/v1`, Swagger at `/api-docs`
- `npm run build` — `nest build --builder swc`
- `npm run lint` — eslint --fix
- `npm run test` / `npm run test:cov` — Jest unit tests (spec files colocated under `src`, one Jest run per file: `npm run test -- path/to/file.spec.ts`)
- `npm run test:e2e` — Jest e2e (`test/jest-e2e.json`)
- `npm run migration:run` / `migration:revert` / `migration:generate` / `migration:create` — TypeORM CLI against `src/database/data-source.ts`

### frontend/ and admin/ (from each directory)
- `npm run dev` — Vite dev server (`frontend` on 5173, `admin` on 4173)
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — eslint
- `npm run preview`
- No test runner is configured in either app; validate changes with `lint` + `build` + manual checks in `dev`.

### chatbot/ (from `chatbot/`)
- `npm run dev` — nodemon (see `chatbot/nodemon.json`)

## Architecture

### Backend (NestJS)

Feature modules live under `backend/src/modules/<feature>/` (controller, service, module, dto/, and sometimes a `*.mapper.ts`), registered in `backend/src/app.module.ts`. Entities are centralized (not per-module) in `backend/src/entities/*.entity.ts`, and TypeORM migrations live in `backend/src/database/migrations/`.

Global request pipeline (wired in `backend/src/main.ts`):
- Global prefix `api/v1`, CORS allow-listing the frontend/admin dev origins, cookie-parser.
- Interceptor chain: `RemoveFieldPasswordInterceptor` → `DateFormatInterceptor` → `ResponseInterceptor` (wraps every response as `{ statusCode, success, data, error }`) → a global `WriteAuditLogInterceptor` (registered as `APP_INTERCEPTOR` in `app.module.ts`).
- `HttpExceptionFilter` global filter, `ValidationPipe({ transform: true, whitelist: true })` global pipe.

Auth is Passport-based JWT (access + refresh cookies) plus Google OAuth — strategies in `backend/src/modules/auth/*.strategy.ts`, guards in `backend/src/common/guards/` (`jwt.guard`, `jwtRefresh.guard`, `google.guard`, `localAuth.guard`, `wsCookieAuth.guard` for sockets).

Authorization is a custom RBAC layer, not Nest's built-in roles: controllers annotate handlers with `@Permissions('domain:action')` (`backend/src/common/decorators/permission.decorator.ts`), enforced by `PermissionsGuard` (`backend/src/common/guards/permissions.guard.ts`), which resolves the caller's effective permissions via `RolePermissionService` (roles → role_permission → permissions, seeded/migrated in `backend/src/database/migrations/`). `RolePermissionModule` is imported globally so the guard can be injected everywhere. When adding a protected endpoint, add/reuse a permission string and gate the route with `@Permissions(...)`.

Real-time features (messages/channels, notifications) go through `backend/src/websockets/websocket.gateway.ts` guarded by `wsCookieAuth.guard`. Background/async work (mail, notifications) goes through BullMQ (`backend/src/bullmq/`). Redis is used both for caching (`redis-cache/`) and BullMQ.

### Frontend / Admin (React + Vite)

`admin/` mirrors `frontend/`'s architecture and is meant to converge on the same patterns as it migrates off mock data — check `frontend/` for the reference implementation of anything not yet built in `admin/`.

Every server interaction flows through exactly these layers, in order — pages/components never call axios/fetch directly:

```
component / page  →  hook (src/hooks/, TanStack Query)  →  api module (src/api/<resource>Api.ts)  →  axios instance (src/configs/axios.ts)
```

- `src/configs/axios.ts` is the single axios instance: base URL, `withCredentials`, and the refresh-token interceptor (queues concurrent 401s, retries once after `/auth/refresh`, redirects to login on failure). Never instantiate a second axios/QueryClient.
- `src/api/<resource>Api.ts` — plain typed HTTP wrappers, always return `res.data`, no React/hooks/toast/navigation.
- `src/hooks/use<Resource>.ts` — TanStack Query hooks; each feature exports a `<feature>QueryKeys` factory (tuple keys) that mutations use for cache invalidation. `retry: false`, default `staleTime: 30_000` (set in `src/main.tsx`) unless a hook needs otherwise.
- `src/store/` (Zustand) holds client-only state (auth user, UI flags) — server data belongs in the Query cache, never in a store.
- `src/types/interface/<resource>.interface.ts` — request/response types plus shared `ApiResponse<T>` / `ApiError`.
- `src/schemas/<domain>.schema.ts` — shared zod validation schemas paired with react-hook-form (`zodResolver`); extract a schema here whenever more than one form needs the same validation rules instead of redefining them inline per page. Established in `frontend/`; `admin/` doesn't have this folder yet but should follow the same convention when it needs cross-form validation reuse.

Pages must render loading / error / empty states for every async view (see `admin/docs/rules.md` §7) and disable submit controls while a mutation is pending. `frontend/` has a shared visual pattern for this in `src/components/notification/` — `StateCard.tsx` is the generic building block, with `ErrorState.tsx` (retry action) and `NotFoundResult.tsx` (empty/no-results, reset action) as ready-made wrappers around it; reuse these instead of hand-rolling ad hoc loading/error markup.

`admin/` currently has `src/services/mockApi.ts` powering screens not yet wired to the backend — do not remove or relocate it; migrate one page at a time following `admin/docs/workflow.md` §7.10.

Both apps use the `@/` alias for `src/`, Tailwind CSS 4 + shadcn/ui primitives (`src/components/ui/`) with composed app components in `src/components/app/`, React Router 7 (`src/routes/AppRoutes.tsx`), and react-hook-form + zod for forms.

### Chatbot (LangChain/LangGraph)

Express server (`src/server.ts`) exposing routes in `src/routes/` → `src/controllers/` → `src/services/`. Conversational flows are LangGraph state graphs in `src/langgraph/*.graph.ts` (booking, diagnosis, report generation, health roadmap, medical-record summary), composed from tools in `src/tools/` (RAG lookup, SQL QA over read-only DB views in `src/entities_view/`, booking, OCR, PDF/report generation). RAG indexing/embedding lives in `src/rag/` and `src/utils/loadDocuments.ts` / `splitDocuments.ts`, backed by Qdrant (`src/configs/vectordb.ts`). PDF/report rendering uses `pdfkit` + `chartjs-node-canvas` (`src/utils/generatePdfReport.ts`, `renderChartToImage.ts`).

## Conventions (apply repo-wide unless a service's own doc says otherwise)

- Naming: kebab-case folders/files, PascalCase React components, `useXxx` hooks, camelCase functions/variables with verb prefixes for actions, `isX/hasX/canX/shouldX` booleans, `UPPER_SNAKE_CASE` true constants, `xxxApi.ts` for API modules, `*.interface.ts` for shared types.
- Reuse existing components/hooks/services before adding new ones; do not introduce a new state, HTTP, or test library without explicit approval.
- Do not delete or rewrite existing code/architecture without approval — if something looks obsolete, flag it instead of removing it.
- `admin/` has its own deeper contributor docs — read `admin/AGENTS.md`, `admin/DESIGN.md`, `admin/docs/rules.md`, and `admin/docs/workflow.md` before making non-trivial changes there (they cover full RBAC-in-UI, query-key, and mutation conventions with worked examples). `frontend/AGENTS.md` documents the equivalent conventions for the patient app.
