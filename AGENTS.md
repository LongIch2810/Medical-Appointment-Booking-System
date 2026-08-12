# Repository Guidelines

## Project Structure & Module Organization

LifeHealth has four TypeScript services. `frontend/` is the patient React/Vite app; `admin/` is the doctor and administrator app. `backend/` is the NestJS API, with features in `src/modules/` and persistence in `src/entities/` and `src/database/`. `chatbot/src/` contains Express/LangChain agents, RAG, routes, and tools. Never edit `dist/`, `dist_old*/`, or dependency directories.

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

Use two-space indentation and TypeScript. Backend Prettier requires single quotes and trailing commas; maintained apps use ESLint. Use PascalCase for components/pages and types, `useXxx` for hooks, and camelCase for functions and variables. NestJS files use `.controller.ts`, `.service.ts`, `.dto.ts`, and `.entity.ts` suffixes. Reuse existing UI primitives; in `frontend/`, shared react-hook-form validation lives in `src/schemas/<domain>.schema.ts` (zod) and shared loading/error/empty-state UI lives in `src/components/notification/` (`StateCard`, `ErrorState`, `NotFoundResult`) — extend these instead of duplicating validation rules or state markup per page (`admin/` doesn't have these yet but should converge on them).

## Testing Guidelines

Backend tests use Jest and Nest testing utilities. Co-locate `*.spec.ts` files with source and run `npm --prefix backend run test:cov`. The clients and chatbot have no test runner, so lint and build affected clients. The e2e script requires the currently absent `backend/test/jest-e2e.json`.

## Commit & Pull Request Guidelines

Use existing Conventional Commit prefixes: `feat:`, `fix:`, `refactor:`, or `chore:`, optionally scoped, as in `feat(admin): add role editor`. Keep subjects imperative. PRs should identify affected services, link issues, list verification, note migrations or environment changes, and include screenshots for UI work.

## Security & Additional Instructions

Copy `.env.example` locally; never commit secrets. Keep migrations reviewable. Within `admin/`, also follow `admin/AGENTS.md` without weakening the mandatory discovery rule.
