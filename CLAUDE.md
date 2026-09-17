# CLAUDE.md

Read `AGENTS.md` first. It is the primary repository guide: project overview, architecture, tech stack, commands, environment variables, database, API/frontend conventions, known constraints, and the documentation map (`specs/as-is/`, service-level `AGENTS.md`/`DESIGN.md`). This file does not repeat that content — it only adds Claude Code-specific working instructions on top of it.

## 1. Required Reading Order

1. `AGENTS.md` (root) — including its §2 Mandatory Codebase Discovery Rule, which governs how Claude Code must search this repo (see §3 below).
2. This file.
3. Whatever nested doc applies to the task — see `AGENTS.md §23 Documentation Map` (`specs/as-is/*.md` for "is this actually true", `frontend/AGENTS.md`+`DESIGN.md` or `admin/AGENTS.md`+`DESIGN.md`+`docs/rules.md`+`docs/workflow.md` for UI work).
4. The actual source files you're about to touch.
5. Existing tests covering that area.

Do not start editing code before this. "It's a small change" is not an exemption — `AGENTS.md §18 Agent Working Rules` applies to every change, not just large ones.

## 2. Claude Code Workflow

- **Discover**: inspect the repo, search for the existing implementation, search for every caller/consumer, identify which of the 4 services are affected (a backend DTO or response-shape change routinely affects `frontend/`, `admin/`, and sometimes `chatbot/` at once — check all three, not just the one you started in).
- **Understand**: read the current flow end to end, identify the source of truth for the behavior in question (`AGENTS.md §24`), identify constraints (`AGENTS.md §22`, `specs/as-is/known-ambiguities.md`).
- **Plan**: for anything non-trivial, identify the files to change, the behavior that must be preserved, the risk, and how you'll validate it — before writing code.
- **Implement**: smallest reasonable change that fixes the root cause; keep the existing architecture (`AGENTS.md §18`).
- **Verify**: run the checks in `AGENTS.md §9` relevant to what changed, plus lint/typecheck/build; review `git diff`.
- **Report**: state exactly what changed, which files, what you verified, and what remains unverified. Never round this up to "done" if a check wasn't run.

## 3. Repository Search Rules — Codebase Discovery Is Mandatory

`AGENTS.md §2` requires every coding agent, Claude Code included, to use the Codebase Memory MCP server (`codebase-memory-mcp`) before searching source code directly:

- If the repository is not indexed, run `index_repository` first.
- Use `search_graph` to find symbols, `trace_path` for callers/callees and data flow, `get_code_snippet` only after resolving an exact qualified name, and `query_graph`/`search_code` for broader analysis.
- Do not begin code discovery with grep, glob, IDE text search, or manual file browsing.
- Fall back to text search only when graph results are insufficient, or when locating string literals, error messages, configuration, documentation, or other non-code content.
- This applies repository-wide, including inside directories that have their own additional instruction files.

Separately from the discovery-tool rule above: before creating a new component, hook, service, utility, API client, validation schema, or config, search the repository (via the graph tools, then grep/glob as needed) for an existing equivalent — see `AGENTS.md §13`/`§17` for the established layering (e.g. `src/api/<resource>Api.ts` → `src/hooks/use<Resource>.ts`, `src/schemas/<domain>.schema.ts` for zod validation, `src/components/notification/` or `src/components/app/` for loading/error/empty states). Do not duplicate an abstraction that already exists.

## 4. Documentation Discipline

Do not treat a comment, README line, or older doc as automatically true. `AGENTS.md §24 Source of Truth` gives the trust order — code and tests outrank prose docs, and the root `README.md` is confirmed to contain at least one inaccuracy (chatbot AI providers, see `AGENTS.md §5`/§15's evidence). If a task touches an area where docs and code disagree, verify against source/tests/config and say so explicitly rather than silently picking one.

## 5. Scope Discipline

Do not, unless the user explicitly asks or the task truly requires it: rewrite a whole module for a small fix, change frameworks, change architecture, do a mass rename, upgrade unrelated dependencies, reformat the whole repository, or edit files outside the task's scope. If you notice something else that looks wrong while working, mention it — don't fix it inline as a drive-by change.

## 6. Debugging Rules

Don't patch the first symptom you see. For any bug:
1. Reproduce or trace the actual flow where possible.
2. Find the root cause (trace upstream/downstream — a bug can originate in a different service than where it's observed, e.g. a `frontend`/`admin` symptom whose cause is in `backend`).
3. Check the network/API/database/cache/auth layers that are actually involved.
4. Fix the cause, not the symptom.
5. Verify the fix and check for regressions in adjacent behavior.

Never delete a feature just to make a bug stop reproducing.

## 7. Frontend/UI Tasks

Beyond `AGENTS.md §13`/§17: preserve existing functionality, don't break accessibility or responsive layout, don't hide or clip important content, check both the patient (`frontend/`) and admin (`admin/`) layouts if a shared component changed, and reuse the existing design system/components (`frontend/DESIGN.md`, `admin/DESIGN.md`) instead of hand-rolling new patterns. If this session has a browser automation tool available, actually load the page and check it — don't claim a visual/responsive fix is verified without having rendered it.

## 8. Backend Tasks

Before changing an API: read the controller, service, DTO, any guard/permission decorator, the database access it triggers, and every frontend/admin caller (see `AGENTS.md §12`/§14). Don't change a response contract casually — if a change is breaking, say so explicitly and identify every consumer that needs to update.

## 9. Database Tasks

Don't change the schema directly. Check `backend/src/entities/`, existing migrations (`backend/src/database/migrations/`), the queries/services that touch the table, and every consumer (backend endpoints, `frontend`/`admin` types, `chatbot`'s read-only views under `chatbot/src/entities_view/` — a schema change can silently break the chatbot's read-only SQL-QA tool if a view it depends on changes shape). Never drop migration history or data unless the user asks for it.

## 10. Environment and Secrets

Never hardcode a secret, commit a populated `.env`, or expose a server-only variable (anything not prefixed `VITE_` in `frontend`/`admin`) to browser code. If a task adds a new environment variable: add it to the relevant service's `.env.example` with a comment (matching the existing style — see `AGENTS.md §10`), note which code reads it, and update `AGENTS.md §10` if it's a variable future agents need to know about.

## 11. Verification Requirements

Before claiming a task is complete, run what's applicable, in this order of preference: (1) the targeted test for the change, (2) the broader relevant test suite (`AGENTS.md §9`), (3) typecheck, (4) lint, (5) build. If something fails, determine whether it's caused by your change or pre-existing on this branch before reporting it — don't hide a failure either way, and say explicitly which is which.

## 12. No Fabrication Rule

Never claim a file, function, endpoint, schema field, environment variable, command, test result, or deployment state exists or passed unless you actually read or ran it in this session. "I haven't checked" is always an acceptable answer; a confident guess is not.

## 13. Completion Standard

A task is not "done" just because code was written. It is done only when: the implementation is updated, the directly affected code was inspected (not just the file you edited), applicable verification from §11 was actually run, the diff was reviewed for unrelated changes, and any remaining limitation or unverified step was stated plainly to the user.
