# Development Rules

## 1. Component Reuse

- Always reuse existing components when they already solve the problem.
- Create a new component only when no existing component fits the required behavior or design.
- Before creating a new component, inspect:
  - `components/`
  - `features/*/components/`
  - `app/*/_components/`
  - existing UI primitives
- Do not duplicate components with slightly different names or styles.
- If an existing component is close but incomplete, prefer extending it safely instead of creating a duplicate.

## 2. File and Folder Placement

- Every new file must have a clear responsibility.
- Place files in the folder that matches their purpose.
- Do not create files in random folders.
- Do not create generic folders like `misc`, `common`, `temp`, `new`, or `test` unless the project already uses them.
- Follow the existing folder structure before introducing a new structure.
- If a file belongs to one feature only, place it inside that feature folder.
- If a file is reused across multiple features, place it in a shared folder such as `components/`, `hooks/`, `lib/`, or `utils/`.

## 3. Most Important Rule: Do Not Delete Codebase

- Never delete existing code, files, folders, components, functions, routes, tests, or configuration unless the user explicitly asks for deletion.
- Do not remove code just because it appears unused.
- Do not rewrite large parts of the codebase without permission.
- Do not replace existing architecture without approval.
- If code seems obsolete, leave it in place and mention it in the final response.
- If deletion is necessary, explain why and ask for confirmation first.

## 4. Security Rules

- Do not log secrets.
- Do not expose environment variables.
- Do not print, return, or commit sensitive values such as:
  - API keys
  - Access tokens
  - Refresh tokens
  - Passwords
  - Private keys
  - Database URLs
  - Session secrets
  - OAuth secrets
- Do not hardcode secrets in source code.
- Use existing environment/config patterns in the project.
- Never expose server-only secrets to client-side code.
- Check whether code runs on the server or client before accessing environment variables.
- Do not add debug logs that may leak user data or sensitive internal state.
- If sensitive data must be handled, keep it scoped to the smallest possible place.
- If a change may affect authentication, authorization, payments, or user data, be extra careful and explain the risk in the final response.

## 5. Import and Export Rules

- Do not import files randomly.
- Follow existing import aliases and project conventions.
- Prefer existing barrel exports only if the project already uses them.
- Do not create new barrel files unless they clearly match the existing structure.
- Avoid deep imports when a cleaner existing export exists.
- Do not introduce circular dependencies.
- Do not move exports around unless necessary.
- Do not rename exported functions, components, or types unless the user explicitly asks.
- Keep imports minimal and remove only imports introduced by your own changes if they are unused.
- Do not change public APIs without approval.

## 6. State Management Rules

- Put state in the correct place.
- Keep local UI-only state inside the component that owns it.
- Lift state only when multiple components need to share it.
- Use existing state management patterns already present in the project.
- Do not introduce a new state library.
- Do not store derived values in state unless necessary.
- Avoid duplicating the same state in multiple places.
- Do not put server data into client state if the project already uses a query/cache/data-fetching pattern.
- Keep form state close to the form unless the project uses a shared form pattern.
- Reset state correctly when dialogs, drawers, filters, or routes change.
- Do not create global state for temporary UI behavior.

## 7. Error, Loading, and Empty State Rules

- UI must not miss loading states.
- UI must not miss error states.
- UI must not miss empty states.
- For async data:
  - Show a loading state while data is being fetched.
  - Show an error state when the request fails.
  - Show an empty state when the request succeeds but returns no data.
- Do not leave blank screens.
- Do not hide errors silently.
- Reuse existing loading, error, skeleton, toast, or empty-state components when available.
- Keep error messages user-friendly.
- Do not expose raw internal errors to users.
- Make retry behavior available when the existing UX pattern supports it.
- Disable or guard actions while pending to prevent duplicate submissions.

## 8. Dependency Rules

- Do not add new packages unless the user explicitly approves.
- Prefer existing dependencies already installed in the project.
- Do not add a dependency for something that can be done simply with existing code.
- Do not change package manager files unless necessary for the task.
- Do not upgrade dependencies unless explicitly requested.
- Do not replace existing libraries with alternatives without approval.
- If a new dependency is truly necessary, explain:
  - Why it is needed
  - What alternatives were considered
  - What files will change
  - Any risks or bundle-size impact

## 9. Routing and Data Fetching Rules

- Follow the routing conventions already used in the project.
- Do not create new routes without confirming they fit the existing route structure.
- Keep server-side logic on the server.
- Keep client-only logic inside client components.
- Do not fetch the same data multiple times unnecessarily.
- Reuse existing API clients, query hooks, server actions, loaders, or services.
- Do not bypass existing auth or permission checks.
- Handle not-found and unauthorized cases correctly.

## 10. Final Response Rules

- The final response must clearly report what was changed.
- Mention files changed or created.
- Mention validations performed.
- Mention anything that could not be completed.
- Mention risks, assumptions, or follow-up work if relevant.
- Do not claim tests passed if they were not run.
- Do not claim a bug is fixed unless the relevant change was actually made.
- Keep the response concise but complete.
- If obsolete or suspicious code was found but not deleted, mention it instead of removing it.
