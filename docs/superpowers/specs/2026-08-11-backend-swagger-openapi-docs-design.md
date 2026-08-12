# Backend Swagger/OpenAPI documentation

Date: 2026-08-11
Status: Approved

## Problem

`backend/src/main.ts` already wires up `SwaggerModule` (`DocumentBuilder` + `SwaggerModule.setup('api-docs', app, ...)`), so `/api-docs` renders and is reachable. But zero `@Api*` decorators exist anywhere in `backend/src` — no `@ApiTags`, `@ApiOperation`, `@ApiProperty`, `@ApiCookieAuth`, `@ApiResponse` across all 26 controllers and their DTOs. The generated page currently shows undifferentiated routes with no grouping, no descriptions, no request/response schemas, and no working "Authorize" button, even though the plumbing to render a real API reference is already in place.

Auth is cookie-based JWT (`req.cookies.accessToken`, set by `backend/src/modules/auth/jwt.strategy.ts`), not a Bearer header, so the default Swagger UI auth affordances don't apply without an explicit cookie auth scheme.

## Design

### 1. Auto-infer DTO schemas via the `@nestjs/swagger` CLI plugin

Add the plugin to `backend/nest-cli.json`'s `compilerOptions.plugins`:

```json
{
  "compilerOptions": {
    "plugins": ["@nestjs/swagger"]
  }
}
```

This introspects every DTO class at build time and synthesizes `@ApiProperty` metadata (type, required/optional, enum values, arrays) from the existing TypeScript types and `class-validator` decorators already on each DTO — no manual per-field decoration needed across the DTOs already used throughout `src/modules/*/dto/`. Manual `@ApiProperty({ description: ... })` can still be added later to specific fields where the auto-inferred type isn't self-explanatory, but that's not required for this pass.

### 2. Cookie auth scheme

In `main.ts`, extend the existing `DocumentBuilder` chain:

```ts
const config = new DocumentBuilder()
  .setTitle('System Booking Doctor')
  .setDescription('API cho hệ thống đặt lịch khám bác sĩ')
  .setVersion('1.0')
  .addCookieAuth('accessToken')
  .build();
```

Then add `@ApiCookieAuth()` to every controller (or individual handler) currently guarded by `JwtGuard`/`PermissionsGuard`, so Swagger UI shows a padlock and routes the browser's session cookie through "Try it out" once a user has logged in via `/auth/login` in another tab (cookies are shared across same-origin requests from the Swagger UI page, which is served by the same backend origin).

### 3. `@ApiTags` + `@ApiOperation` on all 26 controllers

Each controller gets `@ApiTags('<domain>')` at the class level (matching its module name, e.g. `articles`, `doctors`, `appointments`) so Swagger UI groups endpoints by feature instead of listing them flat. Each handler gets `@ApiOperation({ summary: '<short description>' })` — a one-line human-readable summary of what the endpoint does, derived from the existing method name/behavior (no new behavior, purely descriptive).

### 4. Response documentation: pragmatic, not exhaustive

Every response is wrapped by the global `ResponseInterceptor` as `{ statusCode, success, data, error }`. Modeling that envelope precisely for every endpoint (a generic `ApiResponseDto<T>` wrapper via `applyDecorators`) would roughly double the decorator work for marginal benefit. Instead, endpoints get `@ApiOkResponse({ type: XxxResponseDto })` / `@ApiCreatedResponse({ type: XxxResponseDto })` pointing at the **inner** response DTO (the `data` field's shape) — consistent with how most NestJS + Swagger codebases document interceptor-wrapped APIs, and sufficient for a reader to know what shape to expect. Error responses are not individually modeled per endpoint (would require documenting every `NotFoundException`/`ConflictException` thrown per handler); `HttpExceptionFilter`'s consistent error shape is instead documented once, in the top-level `DocumentBuilder` description text.

### 5. Scope

All 26 existing controllers get `@ApiTags` + `@ApiCookieAuth` (where guarded) + `@ApiOperation` per handler. DTOs get schema inference via the CLI plugin (step 1) rather than manual annotation. This is additive-only — no controller logic, routes, guards, or DTOs change behaviorally; only decorators are added.

## Testing

No automated test coverage applies to decorator metadata. Verification is: `npm --prefix backend run build` succeeds (confirms the CLI plugin doesn't break compilation), then `npm --prefix backend run start:dev` and manually load `http://localhost:3000/api-docs`, confirming endpoints are grouped by tag, schemas render for a sample of request/response DTOs, and the Authorize flow (login via `/auth/login`, then "Try it out" on a guarded route) succeeds.
