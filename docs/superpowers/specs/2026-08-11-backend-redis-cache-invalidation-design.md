# Backend Redis cache-aside + invalidation

Date: 2026-08-11
Status: Approved

## Problem

`backend/src/redis-cache/redis-cache.service.ts` already provides `getData`/`setData`/`delData` on top of `ioredis`, and eight services already inject `RedisCacheService`, but the cache-aside pattern around it is unfinished and inconsistent:

- `articles.service.ts`: detail cache (`article:{id}`) works correctly — get-or-populate on read, `delData` on update/delete.
- `topics.service.ts`: list cache (`topics:page=...`) is live but buggy — `setData` has no TTL, and `create`/`update`/`remove` never invalidate it, so stale list data can persist indefinitely until Redis is flushed by hand.
- `doctors.service.ts`, `specialties.service.ts`, `appointments.service.ts`, `role-permission.service.ts`: cache-aside code is written but commented out; mutations don't invalidate anything.
- `doctor-schedules.service.ts`, `health-profile.service.ts`: `RedisCacheService` is injected but unused — no cache code exists yet.

Goal: finish this consistently across all eight services using the simplest correct invalidation strategy, per `CLAUDE.md`'s RBAC/module conventions and without introducing a new caching library.

## Design

### 1. New primitive: `delByPrefix`

`RedisCacheService.delData` only deletes one exact key. List/pagination/filter caches produce a combinatorial key per `page`/`limit`/filter combination, so an update can't know which exact list keys are stale. Add one method:

```ts
async delByPrefix(prefix: string): Promise<void> {
  // client.scanStream({ match: `${prefix}*` }) + pipelined DEL
}
```

Uses ioredis `SCAN` (non-blocking, safe to run against a live Redis instance), not `KEYS`. This is the only new capability added to `RedisCacheService`.

### 2. Key naming convention (no renames needed — already implied by existing code)

- **Detail key** (singular entity name): `article:{id}`, `doctor:{id}`, `permissions:{userId}`. One record, one key. Invalidate with exact `delData(key)` when that specific record changes.
- **List/collection key** (plural entity name, prefixed): `articles:page=...:limit=...:filters=...`, `doctors:page=...`, `topics:page=...`. Invalidate with `delByPrefix('articles:')` etc. on **any** create/update/delete of that entity type, since the changed record's page/filter membership is unknown.
- Singular and plural prefixes never collide (`article:` vs `articles:`), so wiping a list prefix never touches unrelated detail keys, and vice versa.
- All cache writes get a TTL of `3600` seconds (matches the existing `articles` convention) as a safety net — if an invalidation call is ever missed, the entry self-heals within an hour instead of living forever (this is what fixes the current `topics` bug).

### 3. Per-module changes

**articles** (`backend/src/modules/articles/articles.service.ts`)
- Uncomment and enable the `articles:page=...` list cache in `filterAndPagination` (both the public and "Improve" variants), TTL 3600.
- Add `delByPrefix('articles:')` to `create`, `updateArticle`, `deleteArticle`, `approveArticle`. Keep the existing exact-key `delData('article:'+id)` in `updateArticle`/`deleteArticle` as-is.

**topics** (`backend/src/modules/topics/topics.service.ts`)
- Fix `filterAndPagination`: add `3600` TTL to the existing `setData` call.
- Add `delByPrefix('topics:')` to `create`, `update`, `remove`.
- Add a new detail cache (`topic:{id}`) to `getTopic`, invalidated with exact `delData` in `update`/`remove`.

**doctors** (`backend/src/modules/doctors/doctors.service.ts`)
- Uncomment list cache in `filterAndPagination` (`doctors:page=...`) and detail cache in `getDoctorDetail` (`doctor:{id}`), and the single `doctors:outstandingDoctors` key in `getOutstandingDoctors`.
- Add `delByPrefix('doctors:')` (covers the list keys and the `outstandingDoctors` key, which also starts with `doctors:`) plus exact `delData('doctor:'+id)` to `create`, `update`, `remove`.

**specialties** (`backend/src/modules/specialties/specialties.service.ts`)
- Uncomment list cache in `filterAndPagination` (`specialties:page=...`).
- Add a new detail cache (`specialty:{id}`) to `getSpecialtyDetail`.
- Add `delByPrefix('specialties:')` + exact `delData('specialty:'+id)` to `create`, `update`, `delete`.

**appointments** (`backend/src/modules/appointments/appointments.service.ts`)
- Uncomment list cache (`appointments:{userId}:page=...`) and the single-appointment cache (`user:{userId}:appointment:{appointmentId}`).
- Add `delByPrefix('appointments:')` (blunt — wipes every user's cached appointment lists, acceptable per the "simplest" requirement) plus exact `delData` for the affected `user:{userId}:appointment:{id}` key to `create`, `cancel`, `updateStatus`.

**role-permission** (`backend/src/modules/role-permission/role-permission.service.ts`)
- Uncomment `permissions:{userId}` cache in `getPermissionsByRoles`.
- Invalidation has two distinct triggers because the cache key is per-user but permissions are derived from roles:
  - `backend/src/modules/users/users.service.ts` `updateRoles(userId, roleIds)` (changes one user's roles): exact `delData('permissions:'+userId)`.
  - `backend/src/modules/roles/roles.service.ts` `updateRolePermissions` and `deleteRolePermissions` (changes what a role can do, affecting every user with that role): `delByPrefix('permissions:')`.

**doctor-schedules** (`backend/src/modules/doctor-schedules/doctor-schedules.service.ts`)
- New detail cache: `doctorSchedule:{id}` in `getDoctorScheduleDetail`.
- New list cache: `doctorSchedules:doctor:{doctorId}` in `getSchedulesByDoctorId` (no filters/pagination here, so this is a single exact key per doctor — no `delByPrefix` needed, just `delData`).
- Invalidate both in `create`, `update`, `updateActive`, `remove` (all four resolve a `doctorId` already).

**health-profile** (`backend/src/modules/health-profile/health-profile.service.ts`)
- New detail cache: `healthProfile:relative:{relativeId}` in `getHealthProfile`/`getHealthProfileByRelativeId`.
- New list cache: `healthProfiles:user:{userId}:page=...` (from `listHealthProfilesByUserId`) and `healthProfiles:page=...` (from the admin-facing `filterAndPagination`) — both need `delByPrefix('healthProfiles:')` since they're paginated/filtered.
- Invalidate in `create` and `update` with `delByPrefix('healthProfiles:')` + exact `delData` for that relative's detail key.

### 4. Out of scope

- No changes to `RedisCacheService`'s existing OTP/refresh-token/list (`lRange`/`rPush`/`lPop`/`incr`/`lRem`) usages in `auth`, `users.controller`, `permissions.guard` — those aren't response caching and aren't part of this change.
- No new caching library, no `@nestjs/cache-manager`/`CacheInterceptor` wiring (the unused imports already sitting in `redis-cache.module.ts` are dead scaffolding from an earlier attempt and are left untouched — not part of this change).
- No cross-service cache warming or eager invalidation of related entities (e.g. deleting a doctor does not also wipe `doctor-schedules:*`); each module only manages its own keys.

## Testing

Existing Jest unit tests are colocated under `src/**/*.spec.ts`. For each touched service, add/extend spec coverage asserting:
- A `get`-style method returns cached data without hitting the repository when `getData` resolves non-null.
- A `get`-style method calls `setData` with the expected key/TTL on a cache miss.
- Each mutation method calls `delByPrefix`/`delData` with the expected key(s).

No e2e or manual verification plan beyond `npm run test` in `backend/` — this change has no UI surface.
