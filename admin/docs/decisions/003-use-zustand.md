# Use Zustand for Client State

## Status

Accepted

## Context

The admin app needs to manage some state shared across multiple components, such as role-based login state and sidebar state. These values are client state, not server data that needs caching or refetching.

The project currently uses Zustand in:

- `src/store/useAuthStore.ts` for `currentRole`, `currentUser`, `loginAs`, and `logout`.
- `src/store/useUiStore.ts` for sidebar state and sidebar actions.

React Query is already available and should be used for server state when real APIs are integrated. API data should not be stored in Zustand when it needs caching, loading state, error state, invalidation, or refetching.

## Decision

Use Zustand for small shared client state that does not depend on a server request lifecycle.

Zustand stores belong in `src/store/` and should use the `useXxxStore.ts` naming pattern. Each store should own one clear responsibility, such as auth/session UI or layout state. A store should export one hook for components to consume directly.

## Consequences

- Components can access shared state without passing props through many layers.
- Stores stay simpler than Context when state has multiple actions.
- Persist middleware can be used for state that should survive reloads, such as the current mock auth state.
- Overusing Zustand for temporary state makes the app harder to reason about and creates unnecessary global state.

## Implementation Guidelines

- Keep state local when only one component needs it.
- Create or extend a Zustand store only when multiple components or routes need the same state.
- Do not store derived values if they can be computed from existing state.
- Do not store server data in Zustand; use React Query or the existing service/query pattern when real APIs are available.
- Store actions should use clear verb-based names, for example `toggleSidebar`, `setSidebarCollapsed`, `loginAs`, and `logout`.
- When adding persisted state, choose a stable namespaced `name`, for example `admin-auth-store`.
- Do not create one large catch-all store; split stores by domain when responsibilities differ.
