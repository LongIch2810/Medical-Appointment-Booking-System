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
- `npm run test` / `npm run test:cov` — Jest tests under `backend/test/unit/` (mirroring `src/`) and `backend/test/integration/`, one Jest run per file: `npm run test -- path/to/file.spec.ts`
- `npm run test:e2e` — Jest e2e (`test/jest-e2e.json`)
- `npm run migration:run` / `migration:revert` / `migration:generate` / `migration:create` — TypeORM CLI against `src/database/data-source.ts`

### frontend/ and admin/ (from each directory)
- `npm run dev` — Vite dev server (`frontend` on 5173, `admin` on 4173)
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — eslint
- `npm run preview`
- `admin/` has no test runner configured; validate changes with `lint` + `build` + manual checks in `dev`.
- `frontend/` has Playwright end-to-end specs under `frontend/test/e2e/` — `npm run test:e2e` (headless) or `npm run test:e2e:ui` (interactive runner), config in `frontend/playwright.config.ts`.

### chatbot/ (from `chatbot/`)
- `npm run dev` — nodemon (see `chatbot/nodemon.json`), Express server on port 5000
- `npm run build` — `tsc` (emits to `dist/`); `npm run start:prod` runs the built output
- `npm run typecheck` / `npm run typecheck:test` — `tsc --noEmit` against `tsconfig.json` / `tsconfig.test.json`
- `npm run test` / `npm run test:cov` — Node's built-in test runner (not Jest), via `node --loader ts-node/esm --import ./test/noExternalNetwork.ts --test "test/**/*.spec.ts"`; specs live in `chatbot/test/unit/` mirroring `src/`. `noExternalNetwork.ts` blocks real outbound calls, so tests mock `httpClient`/LLM/Qdrant rather than hitting them. Run a single file the same way: swap the glob for the file path.
- `npm run knowledge:build` — rebuilds/reconciles the Qdrant RAG collection from source docs (`src/scripts/buildKnowledgeBase.ts`); only needed when onboarding docs change, not for normal dev.

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

Dates displayed to users are formatted `dd/MM/yyyy` (and `HH:mm dd/MM/yyyy` for date+time) via `formatDateDDMMYYYY`/`formatDateTimeDDMMYYYYHHmm` in `backend/src/utils/formatDate.ts`, applied automatically to every response by the global `DateFormatInterceptor` (recurses into nested objects/arrays, converts any `Date` value it finds). Don't hand-format dates again in a DTO/mapper or in frontend code that already receives one of these interceptor-formatted strings — and if you add a new user-facing date string that bypasses the interceptor (e.g. built manually into a message/report), format it with the same `dd/MM/yyyy` utility for consistency.

### Frontend / Admin (React + Vite)

`admin/` mirrors `frontend/`'s architecture — check `frontend/` for the reference implementation of anything not yet built in `admin/`.

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

Pages must render loading / error / empty states for every async view (see `admin/docs/rules.md` §7) and disable submit controls while a mutation is pending. `frontend/` has a shared visual pattern for this in `src/components/notification/` — `StateCard.tsx` is the generic building block, with `ErrorState.tsx` (retry action) and `NotFoundResult.tsx` (empty/no-results, reset action) as ready-made wrappers around it. `admin/` has its own parallel (differently-named) set in `src/components/app/`: `LoadingState.tsx`, `ErrorState.tsx` (retry action), and `EmptyState.tsx` (title/description, no built-in reset action) — reuse the set that matches whichever app you're in instead of hand-rolling ad hoc loading/error markup.

`admin/` still has `src/services/mockApi.ts`, but only one screen (`EnterpriseReportsDashboardPage`, via `getEnterpriseReportGroups`) actually reads from it now — the other four exported methods have no callers. Do not remove or relocate the file; if migrating that last screen, follow `admin/docs/workflow.md` §7.10.

Both apps use the `@/` alias for `src/`, Tailwind CSS 4 + shadcn/ui primitives (`src/components/ui/`) with composed app components in `src/components/app/`, React Router 7 (`src/routes/AppRoutes.tsx`), and react-hook-form + zod for forms.

`frontend/` is i18n'd via `react-i18next`, locale objects in `src/i18n/locales/{vi,en}.ts`; call sites use `t("namespace.key", { defaultValue: "..." })`. A missing/typo'd key silently renders the `defaultValue` instead of the raw key, which masks the gap visually — periodically audit for keys with no `defaultValue` fallback (those render the raw `namespace.key` string) rather than assuming the UI looking fine means every key resolves. `admin/` has no i18n layer (Vietnamese-only strings inline).

`frontend/`'s real-time notification toast (`NotificationRealtimeProvider`, `src/components/providers/`) fires the instant the backend emits a `notification:new` socket event — independent of, and typically faster than, whatever HTTP request triggered that notification (e.g. a chatbot reply, since the agent still needs an LLM turn to compose the response text). A toast appearing before the corresponding page/chat response is expected given this architecture, not a race-condition bug — don't "fix" it by delaying the toast without confirming the gap isn't just inherent agent/LLM latency.

**Known pitfall:** both `frontend/` and `admin/` deploy via Vercel with an SPA catch-all rewrite (`vercel.json`); Vite fingerprints `React.lazy()` chunk filenames per build, so a browser tab left open across a redeploy can request a chunk that no longer exists. The rewrite's `source` pattern must exclude `/assets/` (`"/((?!assets/).*)"`, not a bare `"/(.*)"`) so a missing chunk gets a real 404 instead of `index.html` (which the browser then rejects with a MIME-type error trying to run it as a module); `frontend/src/main.tsx` also listens for Vite's `vite:preloadError` event to force one reload as a second line of defense. Keep both in place — the rewrite fix alone doesn't help a tab that's already loaded stale JS before the request fails.

### Chatbot (LangChain/LangGraph)

Express server (`src/server.ts`) exposing routes in `src/routes/` → `src/controllers/` → `src/services/`. Conversational flows are LangGraph state graphs in `src/langgraph/*.graph.ts` (booking, diagnosis, report generation, health roadmap), composed from tools in `src/tools/` (RAG lookup, SQL QA over read-only DB views in `src/entities_view/`, booking, PDF/report generation). RAG indexing/embedding lives in `src/rag/` and `src/utils/loadDocuments.ts` / `splitDocuments.ts`, backed by Qdrant (`src/configs/vectordb.ts`). PDF/report rendering uses `pdfkit` + `chartjs-node-canvas` (`src/utils/generatePdfReport.ts`, `renderChartToImage.ts`). Note: the `diagnosis` graph is fully implemented but `src/routes/chatbot.route.ts` never registers a route for it — it is currently unreachable via HTTP (confirmed by `test/integration/chatbot.route.integration.spec.ts`, which mocks it to throw if called). Only `chat`, `create-report`, and `build-health-roadmap` are live endpoints. (The medical-record-summary OCR/upload flow — `ocr.tool.ts`, `summary_medical_record.tool.ts`, the `upload/summary-medical-record` route, and its admin UI — was removed; do not resurrect it from git history without checking why it was pulled.)

The main `/chat` flow's agent graph (`src/agents/agents.ts`) is `guard → agent → tools`: `guard` is a cheap/fast classifier model (`getChatModel({ profile: "fast" })`) that hard-blocks off-topic messages before the main agent runs at all (fails open — proceeds to `agent` — if the classifier throws or returns nothing); `agent` is the main LLM (`OPENAI_MODEL`, currently `gpt-4.1-mini`, bound to `tools`); `tools` runs via `ToolNode`. After a tool call, the graph normally loops back `tools → agent` so the LLM can compose the final answer from the `ToolMessage` — except `booking_appointment_tool`, which already returns a fully-formatted final answer, so the graph short-circuits straight to `__end__` instead (see `shouldContinueAfterTools`); `src/services/chatbot.service.ts`'s `handleChatService` correspondingly searches the message history in reverse for a `booking_appointment_tool` `ToolMessage` and prefers its content over the trailing `AIMessage`. Keep these two in sync if either changes.

Chatbot→backend HTTP calls (chat-history saves, relative/specialty lookups, booking) should go through the shared `httpClient` in `src/configs/httpClient.ts` — an axios instance with keep-alive `http.Agent`/`https.Agent` — instead of a plain axios/fetch call, since a fresh TCP/TLS handshake per request measured ~1.3-1.8s on deploy (larger than the LLM call itself). Retryable upstream calls (Qdrant, backend HTTP, LLM) use `withRetry`/`normalizeChatbotError` from `src/utils/retry.ts`, which normalizes any failure into a `ChatbotOperationError { status, code, retryable }`. Tools/graphs log caught errors via `logSafeError(context, error)` (`src/utils/safeLog.ts`), which intentionally logs only `name`/`code`/`status` (redacts `message`/`stack`) — so a vague `ChatbotOperationError` in logs (e.g. generic `INTERNAL_ERROR`/500) needs a direct repro (small script invoking the graph/tool, or a temporary full-error catch) to see the real cause, not just re-reading the log.

**Known pitfall:** `@qdrant/js-client-rest` must stay pinned at `1.18.0` in `chatbot/package.json`. `@langchain/qdrant@0.1.2` (the LangChain vector store wrapper actually used, via `src/configs/vectordb.ts`) still calls the client's `.search()` method, which `@qdrant/js-client-rest@1.19.0` removed in favor of `.query()`. Bumping past `1.18.0` silently breaks `rag_tool` with `this.client.search is not a function`, surfaced only as a generic `ChatbotOperationError { code: "INTERNAL_ERROR", status: 500 }` since `logSafeError` strips the real message. Do not `npm update`/`npm audit fix` this package without re-verifying `rag_tool` still returns a real answer end-to-end.

## Conventions (apply repo-wide unless a service's own doc says otherwise)

- Naming: kebab-case folders/files, PascalCase React components, `useXxx` hooks, camelCase functions/variables with verb prefixes for actions, `isX/hasX/canX/shouldX` booleans, `UPPER_SNAKE_CASE` true constants, `xxxApi.ts` for API modules, `*.interface.ts` for shared types.
- Reuse existing components/hooks/services before adding new ones; do not introduce a new state, HTTP, or test library without explicit approval.
- Do not delete or rewrite existing code/architecture without approval — if something looks obsolete, flag it instead of removing it.
- `admin/` has its own deeper contributor docs — read `admin/AGENTS.md`, `admin/DESIGN.md`, `admin/docs/rules.md`, and `admin/docs/workflow.md` before making non-trivial changes there (they cover full RBAC-in-UI, query-key, and mutation conventions with worked examples).
- Before making non-trivial Patient UI changes, read both `frontend/AGENTS.md` and `frontend/DESIGN.md`; the design guide governs visual tokens, responsive behavior, accessibility, loading states, and component composition for the patient-facing app.
- Store screenshots referenced by the root `README.md` in `docs/images/` using descriptive kebab-case filenames and relative Markdown paths. Screenshots must come from the real Admin, Doctor, or Patient UI, use demo/anonymized data, omit browser secrets and credentials, and be optimized before committing.
