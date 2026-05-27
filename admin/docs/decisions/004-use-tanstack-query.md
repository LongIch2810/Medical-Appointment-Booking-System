# Use TanStack Query for Server State

## Status

Accepted

## Context

The admin app needs to interact with backend APIs for dashboards, users, doctors, role permissions, messages, content, and audit data. Most screens read paginated lists, fetch a detail record, mutate it, and reflect the change across many places (sidebar counts, dashboard KPIs, related lists).

The project already includes `@tanstack/react-query` v5 in `admin/package.json` and wires `QueryClientProvider` in `src/main.tsx` with sensible defaults (`retry: false`, `staleTime: 30_000`). The sibling `frontend/` workspace already uses TanStack Query as the canonical server-state layer through the `component → hook → api module → axios` flow, with shared `xxxQueryKeys` factories, `useQuery`, `useInfiniteQuery`, and `useMutation` patterns.

Without a dedicated server-state library the admin app would have to handle caching, deduplication, refetch on focus, pagination, invalidation, loading and error states manually. Putting server data into Zustand would duplicate the cache and make invalidation, refetching, and request lifecycle handling fragile.

## Decision

Use TanStack Query (`@tanstack/react-query`) as the single server-state layer for the admin app.

Server data must be fetched, cached, and invalidated through TanStack Query hooks living in `src/hooks/`. API request functions live in `src/api/<resource>Api.ts` and call the shared axios instance in `src/configs/axios.ts`. Pages and components consume hooks only; they do not import `axios` or `fetch` directly. Zustand stays for client state only (auth UI, sidebar, layout flags).

The detailed flow, naming conventions, and code patterns are documented in `docs/workflow.md`, section 7 "API Call Flow (Hook Query Pattern)".

## Consequences

- Caching, deduplication, background refetch, and stale handling are provided by the library, so each screen does not reinvent them.
- Loading, error, and empty states map cleanly to `isLoading`, `isError`, and `data` length checks, matching `docs/rules.md` section 7.
- Pagination is handled with `useInfiniteQuery` using `page` / `totalPages` from the backend, mirroring the `frontend/` convention.
- Mutations standardize cache invalidation through `queryClient.invalidateQueries`, which keeps related screens (dashboards, sidebars, lists) in sync.
- Auth refresh stays centralized in the axios interceptor; hooks do not duplicate refresh or redirect logic.
- The team must follow shared `xxxQueryKeys` factories so invalidation stays correct across files.
- Putting server data into Zustand is no longer allowed; the React Query cache is the source of truth for server data.

## Implementation Guidelines

- Use `useQuery` for reads, `useInfiniteQuery` for paginated lists, `useMutation` for writes. Do not call `axios` from components.
- Place HTTP wrappers in `src/api/<resource>Api.ts`. Always type responses with `ApiResponse<T>` and return `res.data`.
- Place hooks in `src/hooks/`. Use `useXxx.tsx` for single-purpose hooks and `useXxxApi.ts` for grouped feature hooks.
- Export a `<resource>QueryKeys` factory per feature. Query keys are tuples declared `as const` such as `["users", filters] as const`.
- Set `staleTime` per hook based on data volatility. Use `enabled` to gate dependent queries (for example `enabled: id > 0`).
- In `useMutation`, invalidate every query key whose data the mutation affects, surface errors with `toast.error`, and parse `error.details` from the shared `ApiError` interface.
- Do not introduce another data-fetching library (`swr`, `urql`, `ky`, etc.).
- Do not store server data in Zustand. Keep Zustand for client state such as `useAuthStore` and `useUiStore`.
- Do not create a second `QueryClient`. Reuse the instance configured in `src/main.tsx`. Tune defaults at the hook level rather than swapping the global client.
- Run `npm run lint` and `npm run build` after changes that add or refactor hooks or API modules.
