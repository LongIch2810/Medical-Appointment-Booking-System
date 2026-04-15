# AGENTS.md (frontend)

Agent guide for the `frontend/` project.

## Scope

- Applies to: `C:\Users\HUY LONG\Desktop\Project\MyProject\frontend`
- Stack: React 19, TypeScript, Vite 6, React Router 7, TanStack Query 5, Zustand, Tailwind CSS 4
- Package manager: npm (`package-lock.json` is present)
- Module system: ESM (`"type": "module"`)

## Rules files audit (Cursor/Copilot)

- Checked `.cursor/rules/` in this folder: not found
- Checked `.cursorrules` in this folder: not found
- Checked `.github/copilot-instructions.md` in this folder: not found
- If these files are added later, treat them as higher-priority local instructions and update this file

## Install and environment

- Recommended Node.js: LTS (Node 20+)
- Install dependencies from this folder:
  - `npm install`
- Default dev port in Vite config: `5173`
- Vite server is configured with polling watch mode; avoid disabling without reason

## Build, lint, test commands

Current scripts from `frontend/package.json`:

- Start dev server: `npm run dev`
- Build production bundle: `npm run build`
- Lint codebase: `npm run lint`
- Preview built app: `npm run preview`

## Testing status and single-test guidance

- There is currently no `test` script in `frontend/package.json`.
- There is currently no Jest/Vitest config file in this folder.
- Result: single-test execution is not available yet in the current setup.

If test support is added later (recommended: Vitest), use patterns like:

- Run one test file:
  - `npm run test -- src/components/foo/Foo.test.tsx`
- Run one test case by name:
  - `npm run test -- -t "renders loading state"`
- Run tests in watch mode for one file:
  - `npm run test:watch -- src/pages/Home.test.tsx`

Until test tooling exists, validate with:

- `npm run lint`
- `npm run build`
- Manual route and interaction checks in `npm run dev`

## Source layout

- `src/pages`: route-level pages
- `src/components`: reusable UI and feature components
- `src/layouts`: shared page layouts
- `src/routes`: router definitions and route guards
- `src/hooks`: data + behavior hooks
- `src/api`: HTTP request functions
- `src/configs`: shared configuration (Axios, etc.)
- `src/store`: Zustand state stores
- `src/types/interface`: domain interfaces
- `src/utils` and `src/lib`: utility helpers

## Import conventions

- Prefer alias imports via `@/` for in-app modules.
- Alias mapping is defined in TS and Vite config (`@` -> `./src`).
- Keep imports grouped in this order:
  - external libraries
  - internal alias imports (`@/...`)
  - relative imports (`./` / `../`)
- Use `import type` for type-only imports where practical.
- Remove unused imports immediately.

## Formatting conventions

- No project-level Prettier config exists in this folder.
- ESLint is active and should pass with `npm run lint`.
- Existing code is mostly:
  - double quotes
  - semicolons
  - trailing commas in multiline objects/arrays
- A few generated/shadcn-style files may differ; preserve local style in those files.
- Do not mass-reformat unrelated files.

## TypeScript conventions

- TS is strict in app config (`strict: true`, `noUnusedLocals`, `noUnusedParameters`).
- Avoid `any`; if unavoidable, keep scope minimal and prefer `unknown` + narrowing.
- Keep API request/response types explicit in `src/types/interface`.
- Add null checks for values that may be absent from async data.
- Use narrow unions and literal types for constrained values.

## React conventions

- Components are function components; `React.FC` is commonly used in this codebase.
- Page, layout, and component filenames use PascalCase.
- Hooks must start with `use` and live in `src/hooks` when reusable.
- Keep side effects in hooks/components with clear dependency arrays.
- Avoid putting network logic directly in page JSX files when reusable APIs/hooks exist.

## Routing conventions

- Central routing lives in `src/routes/AppRoutes.tsx`.
- Keep public/protected route boundaries explicit.
- Add new routes in one place and ensure 404 route remains intact.
- Prefer absolute route strings that match existing style.

## Data fetching and API conventions

- Axios instance is centralized in `src/configs/axios.ts`.
- API wrappers live in `src/api/*` and return `res.data`.
- React Query hooks should encapsulate query keys and mutation behavior.
- Reuse established query keys when extending existing resources.
- Keep auth refresh behavior intact (queue + retry logic in Axios interceptor).

## State management conventions

- Zustand is used for client state (`src/store/*`).
- Store files typically follow `useXxxStore.ts` naming.
- Keep store surface minimal: state + focused actions.
- Use `persist` middleware only when data must survive reloads.
- Do not persist sensitive transient data unless required.

## Naming conventions

- Components/pages/layouts: PascalCase (`DoctorDetail.tsx`)
- Hooks: `useXxx` (`useLogin.tsx`)
- API modules: `xxxApi.ts` (`authApi.ts`)
- Interfaces: descriptive names in `*.interface.ts`
- Boolean variables: prefix with `is/has/can/should`
- Constants: UPPER_SNAKE_CASE only for true constants

## Error handling conventions

- Surface user-facing errors with consistent toast/messages.
- Keep transport/error parsing near API/hook boundaries.
- Use shared error interfaces when available (`ApiError`).
- Never silently swallow request failures.
- Redirect/logout behavior for auth failures should remain centralized.

## CSS and UI conventions

- Global design tokens and Tailwind theme vars are in `src/index.css`.
- Prefer utility classes + shared UI components over ad-hoc inline styles.
- Reuse existing `cn` helper from `src/lib/utils.ts` for class merging.
- Keep color/spacing decisions aligned with existing token system.
- Preserve accessibility basics: semantic elements, labels, keyboard support.

## Change safety rules

- Keep edits focused to the user request.
- Do not commit generated files unless explicitly asked.
- Do not introduce new frameworks without strong justification.
- Use only the installed stack and existing project dependencies unless the user explicitly requests otherwise.
- Reuse existing components before creating new ones when they satisfy the requirement.
- Prefer extending existing patterns over inventing parallel structures.
- When changing shared types, update all consumers in the same change.
