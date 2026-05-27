# Development Workflow

This document defines the required workflow for agents working on the admin frontend. The goal is to keep changes aligned with the request, the existing architecture, and a clear validation process.

## 1. Read Project Context First

Before coding, agents must read the relevant project documents:

- `AGENTS.md`: contributor rules, project structure, build/lint commands, and naming conventions.
- `DESIGN.md`: UI/UX guidance, visual style, colors, typography, and interface direction.
- `docs/decisions/`: accepted technical decisions such as React, Tailwind CSS + shadcn/ui, and Zustand.
- `docs/architecture.md`: architecture overview when the file has content.
- `docs/rules.md`: required rules for component reuse, file placement, state, security, dependencies, and final responses.

If the request affects UI, also inspect existing components in `src/components/ui/`, `src/components/app/`, and the related page in `src/pages/`.

## 2. Plan Before Coding

Always make a plan before editing files. The plan should identify:

- The user goal.
- Files or modules likely to be affected.
- Existing components, stores, services, or config that can be reused.
- Main risks, such as routing, permissions, auth, state, APIs, responsive UI, or visual regression.
- The validation steps to run after coding.

Do not start coding before understanding the current flow. If the request is ambiguous and a wrong change would be risky, ask a short clarification question first.

## 3. Code With Existing Tech Stack

When coding, follow the existing stack and patterns:

- React + TypeScript for UI.
- React Router for navigation.
- Tailwind CSS + shadcn/ui for styling and UI primitives.
- Zustand for shared client state.
- React Query or the existing service pattern for server state and APIs when real integrations exist.
- The `@/*` alias for imports from `src`.

Prefer small, scoped changes. Do not rewrite architecture, add dependencies, or delete code/files unless the user explicitly asks. Reuse existing components before creating new ones.

## 4. Keep Files in the Right Place

Place files by responsibility:

- Route-level screen: `src/pages/`.
- Layout: `src/layouts/`.
- UI primitive: `src/components/ui/`.
- Reusable business component: `src/components/app/`.
- Store Zustand: `src/store/`.
- Menu, permission, or module config: `src/config/`.
- Pure helper: `src/lib/`.
- Shared type: `src/types/`.
- Mock data: `src/mock/`.

Do not create vague folders such as `misc`, `temp`, `new`, or `common` unless the repository already uses that pattern.

## 5. Validate After Coding

After coding, agents must validate the result against the original request and the plan:

- Run `npm run lint` when TypeScript or React code changes.
- Run `npm run build` when the change may affect build output, types, or routing.
- For UI changes, run the app with `npm run dev` and check it in a browser when possible.
- Check loading, error, empty, disabled, and responsive states when the screen has data or interactions.
- Confirm the change does not break auth, permissions, navigation, or shared layout.

Do not claim that testing was completed unless the command or browser check actually ran.

## 6. Final Response Format

The final response must follow `docs/rules.md`, section `Final Response Rules`.

Include:

- Files created or changed.
- A short summary of the main changes.
- Validation performed, such as `npm run lint`, `npm run build`, or browser checks.
- Anything that could not be completed.
- Risks, assumptions, or follow-up work when relevant.

Keep the response concise, clear, and limited to relevant information.

## 7. API Call Flow (Hook Query Pattern)

The admin frontend mirrors the API call architecture used in the `frontend/` workspace. Every server interaction must flow through three layers, in this exact order:

```
component / page  →  hook (TanStack Query)  →  api module (axios)  →  axios instance (configs/axios)
```

Components and pages must never call `axios` or `fetch` directly. They must consume a hook from `src/hooks/`.

### 7.1 Layer responsibilities

- **`src/configs/axios.ts`** — single axios instance. Owns base URL, `withCredentials`, request/response interceptors, refresh-token queue, 401 retry logic, and centralized auth-failure redirect. Never bypass this instance.
- **`src/api/<resource>Api.ts`** — pure HTTP wrappers. Each function takes typed input, calls `axiosInstance.<method>(...)`, returns `res.data`, and may normalize the response shape. No React, no hooks, no toast, no navigation.
- **`src/hooks/use<Resource>.tsx` or `src/hooks/use<Feature>Api.ts`** — TanStack Query hooks. Encapsulates `queryKey`, `queryFn`, `staleTime`, `enabled`, `getNextPageParam`, and mutation side effects (`onSuccess`, `onError`, cache invalidation, toast, navigation, store updates).
- **`src/types/interface/<resource>.interface.ts`** — request payloads, response shapes, and shared `ApiResponse<T>` / `ApiError` interfaces.
- **`src/store/`** — Zustand stores hold client state only (auth user, UI flags). Server data lives in the React Query cache, not in stores.

### 7.2 Folder additions for the admin workspace

The admin folder currently has `src/services/mockApi.ts` for mock-driven screens. Real API integration adds these folders, matching the `frontend/` layout:

- `src/configs/` — `axios.ts` (create when wiring the first real endpoint).
- `src/api/` — one file per backend resource, named `<resource>Api.ts` (e.g. `authApi.ts`, `userApi.ts`, `doctorApi.ts`).
- `src/hooks/` — one file per query/mutation or per feature group (e.g. `useLogin.tsx`, `useAdminDashboard.ts`, `useUsersApi.ts`).
- `src/types/interface/` — `<resource>.interface.ts` plus the shared `apiError.interface.ts` and `ApiResponse<T>` helper type.

Do not move or rename `src/services/mockApi.ts`. Mock-driven screens keep using it until each module is migrated to a real hook.

### 7.3 Naming conventions for API code

- API modules: `xxxApi.ts` in `src/api/` (camelCase file, lowercase resource).
- Exported request functions: camelCase verbs — `fetchX`, `createX`, `updateX`, `deleteX`, `login`, `logout`, `refresh`.
- Hooks: `useXxx.tsx` for single-purpose hooks, `useXxxApi.ts` for grouped hooks of one feature.
- Hook factories per feature should export a `xxxQueryKeys` constant (see frontend `articleQueryKeys`, `patientQueryKeys`).
- Query keys: tuple form `["resource", ...params] as const`. Reuse the same root key across hooks that touch the same cache slice, so invalidation works.
- Types: `<Resource>Payload`, `<Resource>Response`, `ApiResponse<T>`, `ApiError`, all in `src/types/interface/`.

### 7.4 Required pattern: API module

```ts
// src/api/userApi.ts
import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type { User, UserListPayload } from "@/types/interface/user.interface";

export const fetchUsers = async (data: UserListPayload) => {
  const res = await axiosInstance.post<ApiResponse<User[]>>("/users", data);
  return res.data;
};

export const fetchUserDetail = async (userId: number) => {
  const res = await axiosInstance.get<ApiResponse<User>>(`/users/${userId}`);
  return res.data;
};
```

Rules:

- Always type the response with `ApiResponse<T>`.
- Always return `res.data`.
- Normalize awkward backend shapes inside the API module, not in the hook or component.

### 7.5 Required pattern: Query hook

```ts
// src/hooks/useUsers.ts
import { useQuery } from "@tanstack/react-query";
import { fetchUserDetail, fetchUsers } from "@/api/userApi";
import type { UserListPayload } from "@/types/interface/user.interface";

export const userQueryKeys = {
  list: (filters: UserListPayload) => ["users", filters] as const,
  detail: (userId: number) => ["user-detail", userId] as const,
};

export function useUsers(filters: UserListPayload) {
  return useQuery({
    queryKey: userQueryKeys.list(filters),
    queryFn: () => fetchUsers(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserDetail(userId: number) {
  return useQuery({
    queryKey: userQueryKeys.detail(userId),
    queryFn: () => fetchUserDetail(userId),
    enabled: userId > 0,
    staleTime: 1000 * 60 * 5,
  });
}
```

Rules:

- Use `useQuery` for reads, `useInfiniteQuery` for paginated lists, `useMutation` for writes.
- Always declare `queryKey` from a shared `<feature>QueryKeys` factory.
- Use `enabled` to gate dependent queries (e.g. `enabled: id > 0`).
- Use `staleTime` to limit refetch noise. Default range: `30s` (mutable data) to `5–30 min` (lookups).
- Do not put `try/catch` around `useQuery`. Surface errors with `query.error` or `onError`.

### 7.6 Required pattern: Mutation hook

```ts
// src/hooks/useUpdateUser.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import { updateUser } from "@/api/userApi";
import { userQueryKeys } from "@/hooks/useUsers";
import type { ApiError } from "@/types/interface/apiError.interface";

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: (_, variables) => {
      toast.success("Cập nhật người dùng thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({
        queryKey: userQueryKeys.detail(variables.id),
      });
    },
    onError: (error) => {
      const axiosError = error as AxiosError<ApiError>;
      const details = axiosError.response?.data.error?.details;
      const message = Array.isArray(details)
        ? details[0]
        : details || "Cập nhật thất bại";
      toast.error(message);
    },
  });
}
```

Rules:

- Mutations must invalidate every query key whose data they affect.
- Auth-related mutations call `queryClient.clear()` or remove `["profile"]` on logout, exactly like `useLogout` in `frontend/`.
- Do not catch and silently swallow errors. Either `toast.error` or rethrow.
- Use the shared `ApiError` interface to read `error.details`.

### 7.7 Required pattern: Infinite query hook

```ts
// src/hooks/useUsersInfinite.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchUsers } from "@/api/userApi";
import type { UserListPayload } from "@/types/interface/user.interface";

export function useUsersInfinite(
  filters: Omit<UserListPayload, "page"> = { limit: 20 },
) {
  return useInfiniteQuery({
    queryKey: ["users-infinite", filters],
    queryFn: ({ pageParam }) =>
      fetchUsers({ page: pageParam as number, ...filters }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5,
  });
}
```

Rules:

- Always provide `initialPageParam`.
- Drive `getNextPageParam` from `page` and `totalPages` returned by the backend.

### 7.8 Component / page consumption

Pages and components only call hooks, render the three required states, and forward callbacks.

```tsx
const { data, isLoading, isError, refetch } = useUsers(filters);

if (isLoading) return <SkeletonList />;
if (isError) return <ErrorState onRetry={refetch} />;
if (!data?.data.length) return <EmptyState />;

return <DataTable rows={data.data} />;
```

Rules:

- Never import from `@/api/*` or `@/configs/axios` inside pages or components.
- Never put server data into a Zustand store.
- Always render loading, error, and empty states (see `docs/rules.md` section 7).
- Disable submit buttons while `mutation.isPending` is true.

### 7.9 Auth and refresh-token handling

- `axiosInstance` is the only place that talks to `/auth/refresh`. Hooks must not call refresh directly.
- 401 responses outside `/auth/login` and `/auth/register` are auto-retried once after refresh.
- On refresh failure the interceptor calls logout, resets the auth store, and redirects to the login route. Hooks must not duplicate that logic.
- Login/logout hooks update `useAuthStore` and call `queryClient.clear()` or invalidate `["profile"]` exactly like `frontend/` does.

### 7.10 Migration plan from mock to real API

When converting a mock-backed page to a real endpoint:

1. Add the request typing to `src/types/interface/<resource>.interface.ts`.
2. Add the request function to `src/api/<resource>Api.ts`.
3. Add the hook to `src/hooks/` with a shared `<resource>QueryKeys` factory.
4. Replace the page's `mockApi` import with the new hook. Keep `mockApi.ts` and unused mock files in place (see `docs/rules.md` section 3).
5. Run `npm run lint` and `npm run build`.
6. Smoke-test the page in `npm run dev`, including loading, error, and empty states.

### 7.11 QueryClient configuration

`src/main.tsx` already wires `QueryClientProvider`. Default options today:

- `retry: false`
- `staleTime: 30_000`

Do not change these defaults inside individual hooks unless the data clearly needs different behavior; tune `staleTime` per hook as needed. Do not create a second `QueryClient` instance.

### 7.12 Don'ts

- Do not call `axios` or `fetch` directly from pages, components, layouts, or stores.
- Do not duplicate query keys across files. Centralize per feature.
- Do not put server-fetched data into Zustand.
- Do not add new HTTP libraries (`ky`, `swr`, `urql`, etc.).
- Do not mutate React Query cache manually unless an optimistic update truly requires it.
- Do not catch errors only to hide them from the user.
