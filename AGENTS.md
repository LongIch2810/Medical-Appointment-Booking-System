# Repository Guidelines

## Project Structure & Module Organization

LifeHealth has four TypeScript services. `frontend/` is the patient React/Vite app; `admin/` is the doctor and administrator app. `backend/` is the NestJS API, with features in `src/modules/` and persistence in `src/entities/` and `src/database/`. `chatbot/src/` contains Express/LangChain agents, RAG, routes, and tools. Patient UI work must follow `frontend/AGENTS.md` and `frontend/DESIGN.md`; doctor/admin UI work must follow `admin/AGENTS.md` and `admin/DESIGN.md`. Never edit `dist/` or dependency directories.

## Mandatory Codebase Discovery Rule

Codex MUST begin every source-code discovery task with Codebase Memory MCP. Run `index_repository` if the project is not indexed. Use `search_graph` for symbols, `trace_path` for relationships and data flow, `get_code_snippet` after resolving a qualified name, and `query_graph` or `search_code` for broader analysis. Direct grep, glob, IDE search, or manual browsing is allowed only when graph results are insufficient or for literals, errors, configuration, documentation, and non-code files. This applies under nested instructions too.

## Build, Test, and Development Commands

Run from the repository root:

- `npm --prefix frontend ci` (repeat for each service) installs locked dependencies.
- `docker compose -f docker-compose.dev.yml up -d` starts the development stack.
- `npm --prefix frontend run dev` or `npm --prefix admin run dev` starts a client.
- `npm --prefix backend run start:dev` starts the API; `npm --prefix chatbot run dev` starts the chatbot.
- Client `build` scripts type-check and bundle; client `lint` scripts run ESLint.
- Backend `build`, `test`, `test:cov`, and `lint` compile and verify the API.

## Coding Style & Naming Conventions

Use two-space indentation and TypeScript. Backend Prettier requires single quotes and trailing commas; maintained apps use ESLint. Use PascalCase for components/pages and types, `useXxx` for hooks, and camelCase for functions and variables. NestJS files use `.controller.ts`, `.service.ts`, `.dto.ts`, and `.entity.ts` suffixes. Reuse existing UI primitives; in `frontend/`, shared react-hook-form validation lives in `src/schemas/<domain>.schema.ts` (zod) and shared loading/error/empty-state UI lives in `src/components/notification/` (`StateCard`, `ErrorState`, `NotFoundResult`) — extend these instead of duplicating validation rules or state markup per page. `admin/` has its own parallel loading/error/empty-state components under `src/components/app/` (`EmptyState.tsx`, `ErrorState.tsx`, `LoadingState.tsx`) — reuse those in `admin/` — but still has no `src/schemas/` folder for zod validation.

## Testing Guidelines

Backend tests use Jest and Nest testing utilities, under `backend/test/unit/` (mirroring `src/`) and `backend/test/integration/`; run with `npm --prefix backend run test:cov`. `frontend/` has Playwright end-to-end specs under `frontend/test/e2e/` — run with `npm --prefix frontend run test:e2e` (or `test:e2e:ui` for the interactive runner). `admin/` and `chatbot/` still have no test runner, so lint and build affected clients.

## Commit & Pull Request Guidelines

Use existing Conventional Commit prefixes: `feat:`, `fix:`, `refactor:`, or `chore:`, optionally scoped, as in `feat(admin): add role editor`. Keep subjects imperative. PRs should identify affected services, link issues, list verification, note migrations or environment changes, and include screenshots for UI work.

## Documentation & Screenshots

Keep product screenshots used by the root `README.md` under `docs/images/` with descriptive kebab-case names. Capture real Admin, Doctor, and Patient screens with demo or anonymized data only; never expose credentials, tokens, API keys, or real medical records. Optimize images for repository use, reference them with relative paths, and verify links render correctly after moving or renaming an asset.

## Security & Additional Instructions

Copy `.env.example` locally; never commit secrets. Keep migrations reviewable. Nested `AGENTS.md` and `DESIGN.md` files add service-specific requirements without weakening the mandatory discovery rule.
