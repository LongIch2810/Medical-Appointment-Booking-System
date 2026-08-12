# Backend Swagger/OpenAPI Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the already-wired-but-empty `/api-docs` Swagger page into a real API reference: DTO schemas via the CLI plugin, cookie-based auth support, and `@ApiTags`/`@ApiOperation` grouping across all 26 controllers.

**Architecture:** One CLI-plugin config change (auto-infers `@ApiProperty` for every DTO, no manual per-field work), one `DocumentBuilder`/`main.ts` change (cookie auth scheme), and additive-only decorator changes to 26 controller files (no route/guard/logic changes).

**Tech Stack:** `@nestjs/swagger` (already a dependency), NestJS CLI plugin system.

**Implementation note (2026-08-11):** Current guards differ from parts of the original inventory. `articles`, `doctors`, `relationships`, `specialties`, and `topics` contain both public and guarded routes, so cookie auth is documented per guarded route. In `auth`, cookie auth applies to `refresh`, `logout`, and `logout-all`; `set-new-password` is public. The SWC plugin's generated `src/metadata.ts` is cleaned before build/start and loaded from compiled `metadata.js` at bootstrap to keep NodeNext builds repeatable.

## Global Constraints

- Purely additive: no controller logic, route paths, guards, or DTOs change behaviorally — only decorators are added.
- `@ApiCookieAuth()` goes on every controller/route currently guarded by `JwtAuthGuard` (alone or combined with `PermissionsGuard`) or `JwtRefreshAuthGuard`. It does **not** go on `LocalAuthGuard` or `GoogleAuthGuard` routes (credential/redirect-based, not cookie-session-based) or on fully public routes.
- Verification per task: `npm --prefix backend run build` (confirms the CLI plugin and new decorators compile cleanly) — no test runner coverage applies to decorator metadata.
- Spec: `docs/superpowers/specs/2026-08-11-backend-swagger-openapi-docs-design.md`.
- Route/verb inventory used throughout this plan was captured from the running backend's own Nest bootstrap log (`RouterExplorer Mapped {...}` lines), so it reflects the actual live routes, not a guess.

---

### Task 1: CLI plugin + cookie auth scheme

**Files:**
- Modify: `backend/nest-cli.json`
- Modify: `backend/src/main.ts`

- [x] **Step 1: Enable the `@nestjs/swagger` CLI plugin**

In `backend/nest-cli.json`, add `plugins` inside `compilerOptions`:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "outputPath": "dist",
    "builder": "swc",
    "typeCheck": true,
    "plugins": ["@nestjs/swagger"],
    "watchOptions": {
      "poll": 1000
    },
    "assets": [
      {
        "include": "**/templates/**/*",
        "outDir": "./dist"
      }
    ]
  }
}
```

- [x] **Step 2: Add the cookie auth scheme to `DocumentBuilder`**

In `backend/src/main.ts`, extend the existing builder chain:

```ts
  const config = new DocumentBuilder()
    .setTitle('System Booking Doctor')
    .setDescription('API cho hệ thống đặt lịch khám bác sĩ')
    .setVersion('1.0')
    .addCookieAuth('accessToken')
    .build();
```

- [x] **Step 3: Verify it builds**

Run: `npm --prefix backend run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/nest-cli.json backend/src/main.ts
git commit -m "feat(backend): enable Swagger CLI plugin and cookie auth scheme"
```

---

### Task 2: `@ApiTags`/`@ApiOperation`/`@ApiCookieAuth` — group A (appointments, articles, audit-logs, auth, channels)

**Files:**
- Modify: `backend/src/modules/appointments/appointments.controller.ts`
- Modify: `backend/src/modules/articles/articles.controller.ts`
- Modify: `backend/src/modules/audit-logs/audit-logs.controller.ts`
- Modify: `backend/src/modules/auth/auth.controller.ts`
- Modify: `backend/src/modules/channels/channels.controller.ts`

For every controller in this plan, the pattern is the same 3-part edit:
1. Add `ApiTags`, `ApiOperation`, `ApiCookieAuth` to the existing `@nestjs/swagger` import (or add a new import line if none exists yet).
2. Add `@ApiTags('<tag>')` directly above `@Controller(...)`; add `@ApiCookieAuth()` there too **only if the controller has a class-level `@UseGuards(JwtAuthGuard, ...)`**.
3. Add `@ApiOperation({ summary: '<text>' })` directly above each route decorator (`@Get()`, `@Post()`, `@Patch()`, `@Delete()`, `@Put()`), matching the route list given.

- [x] **Step 1: `appointments.controller.ts`** (class-level `@UseGuards(JwtAuthGuard, PermissionsGuard)` → gets class-level `@ApiCookieAuth()`)

Add above `@Controller('appointments')`:

```ts
@ApiTags('appointments')
@ApiCookieAuth()
```

Add `@ApiOperation` above the matching route decorator for each:
- `POST /appointments/booking` → `{ summary: 'Đặt lịch khám (bệnh nhân tự đặt)' }`
- `POST /appointments/admin/appointments` → `{ summary: 'Đặt lịch khám hộ bệnh nhân (admin)' }`
- `POST /appointments/doctor/appointments` → `{ summary: 'Danh sách lịch hẹn của bác sĩ đang đăng nhập' }`
- `POST /appointments/personal-appointments` → `{ summary: 'Danh sách lịch hẹn cá nhân của bệnh nhân' }`
- `GET /appointments/:appointmentId` → `{ summary: 'Chi tiết một lịch hẹn' }`
- `PATCH /appointments/:appointmentId/status` → `{ summary: 'Cập nhật trạng thái lịch hẹn' }`
- `DELETE /appointments/cancel/:id` → `{ summary: 'Hủy lịch hẹn' }`

- [x] **Step 2: `articles.controller.ts`** (mixed public/guarded routes → guarded routes get `@ApiCookieAuth()`)

Add above `@Controller('articles')`:

```ts
@ApiTags('articles')
```

Add `@ApiCookieAuth()` to the guarded create, update, approve, and delete routes only.

Routes:
- `POST /articles/create-article` → `{ summary: 'Tạo bài viết' }`
- `POST /articles` → `{ summary: 'Danh sách bài viết (phân trang, lọc)' }`
- `GET /articles/:articleId` → `{ summary: 'Chi tiết bài viết' }`
- `PATCH /articles/:articleId` → `{ summary: 'Cập nhật bài viết' }`
- `PUT /articles/:articleId` → `{ summary: 'Duyệt bài viết' }`
- `DELETE /articles/:articleId` → `{ summary: 'Xóa bài viết' }`

- [x] **Step 3: `audit-logs.controller.ts`** (class-level `@UseGuards(JwtAuthGuard, PermissionsGuard)` → gets class-level `@ApiCookieAuth()`)

Add above `@Controller('audit-logs')`:

```ts
@ApiTags('audit-logs')
@ApiCookieAuth()
```

Routes:
- `POST /audit-logs` → `{ summary: 'Danh sách nhật ký thao tác (phân trang, lọc)' }`

- [x] **Step 4: `auth.controller.ts`** (no class-level guard — mixed per-route: `LocalAuthGuard`/`GoogleAuthGuard` stay without `@ApiCookieAuth()`; `JwtAuthGuard`/`JwtRefreshAuthGuard` routes get it)

Add above `@Controller('auth')`:

```ts
@ApiTags('auth')
```

Add `@ApiOperation` above every route decorator, and additionally add `@ApiCookieAuth()` on the three routes guarded by `JwtRefreshAuthGuard` or `JwtAuthGuard`/`PermissionsGuard`: `refresh`, `logout`, and `logout-all`.
- `POST /auth/login` → `{ summary: 'Đăng nhập' }`
- `POST /auth/admin/login` → `{ summary: 'Đăng nhập cho admin/bác sĩ' }`
- `POST /auth/register` → `{ summary: 'Đăng ký tài khoản' }`
- `POST /auth/refresh` → `{ summary: 'Làm mới access token' }` + `@ApiCookieAuth()`
- `POST /auth/logout` → `{ summary: 'Đăng xuất' }` + `@ApiCookieAuth()`
- `POST /auth/logout-all` → `{ summary: 'Đăng xuất khỏi tất cả thiết bị' }` + `@ApiCookieAuth()`
- `POST /auth/set-new-password` → `{ summary: 'Đặt lại mật khẩu mới' }`
- `GET /auth/google` → `{ summary: 'Bắt đầu đăng nhập Google OAuth' }`
- `GET /auth/google/redirect` → `{ summary: 'Callback redirect từ Google OAuth' }`

- [x] **Step 5: `channels.controller.ts`** (class-level `@UseGuards(JwtAuthGuard, PermissionsGuard)` → gets class-level `@ApiCookieAuth()`)

Add above `@Controller('channels')`:

```ts
@ApiTags('channels')
@ApiCookieAuth()
```

Routes:
- `POST /channels/create` → `{ summary: 'Tạo kênh chat' }`
- `POST /channels/personal-channels` → `{ summary: 'Danh sách kênh chat của người dùng đang đăng nhập' }`
- `GET /channels/:channelId` → `{ summary: 'Chi tiết kênh chat' }`

- [x] **Step 6: Verify it builds**

Run: `npm --prefix backend run build`
Expected: succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/appointments/appointments.controller.ts backend/src/modules/articles/articles.controller.ts backend/src/modules/audit-logs/audit-logs.controller.ts backend/src/modules/auth/auth.controller.ts backend/src/modules/channels/channels.controller.ts
git commit -m "feat(backend): add Swagger tags/operations/auth decorators — group A"
```

---

### Task 3: group B (chat-history, complaints, dashboard, doctor-schedules, doctors)

**Files:**
- Modify: `backend/src/modules/chat-history/chat-history.controller.ts`
- Modify: `backend/src/modules/complaints/complaints.controller.ts`
- Modify: `backend/src/modules/dashboard/dashboard.controller.ts`
- Modify: `backend/src/modules/doctor-schedules/doctor-schedules.controller.ts`
- Modify: `backend/src/modules/doctors/doctors.controller.ts`

The first four have class-level `@UseGuards(JwtAuthGuard, PermissionsGuard)`. `doctors` has mixed public/guarded routes, so cookie auth is applied per guarded route.

- [x] **Step 1: `chat-history.controller.ts`**

Add above `@Controller('chat-history')`:

```ts
@ApiTags('chat-history')
@ApiCookieAuth()
```

Routes:
- `POST /chat-history/chat` → `{ summary: 'Gửi tin nhắn tới chatbot' }`
- `POST /chat-history` → `{ summary: 'Lưu lịch sử hội thoại' }`
- `GET /chat-history/:userId` → `{ summary: 'Lịch sử hội thoại của người dùng' }`
- `GET /chat-history/context/:userId` → `{ summary: 'Ngữ cảnh hội thoại gần nhất của người dùng' }`

- [x] **Step 2: `complaints.controller.ts`**

Add above `@Controller('complaints')`:

```ts
@ApiTags('complaints')
@ApiCookieAuth()
```

Routes:
- `POST /complaints/create` → `{ summary: 'Gửi góp ý/khiếu nại' }`
- `POST /complaints/my` → `{ summary: 'Danh sách góp ý/khiếu nại của tôi' }`
- `POST /complaints` → `{ summary: 'Danh sách góp ý/khiếu nại (phân trang, lọc)' }`
- `GET /complaints/:complaintId` → `{ summary: 'Chi tiết góp ý/khiếu nại' }`
- `PATCH /complaints/:complaintId` → `{ summary: 'Phản hồi/cập nhật góp ý/khiếu nại' }`
- `DELETE /complaints/:complaintId` → `{ summary: 'Xóa góp ý/khiếu nại' }`

- [x] **Step 3: `dashboard.controller.ts`**

Add above `@Controller('dashboard')`:

```ts
@ApiTags('dashboard')
@ApiCookieAuth()
```

Routes:
- `GET /dashboard/patient` → `{ summary: 'Thống kê dashboard bệnh nhân' }`
- `GET /dashboard/doctor` → `{ summary: 'Thống kê dashboard bác sĩ' }`
- `GET /dashboard/admin` → `{ summary: 'Thống kê dashboard admin' }`

- [x] **Step 4: `doctor-schedules.controller.ts`**

Add above `@Controller('doctor-schedules')`:

```ts
@ApiTags('doctor-schedules')
@ApiCookieAuth()
```

Routes:
- `POST /doctor-schedules/create-schedule` → `{ summary: 'Tạo ca khám cho bác sĩ' }`
- `POST /doctor-schedules/personal-schedules` → `{ summary: 'Danh sách ca khám của bác sĩ đang đăng nhập' }`
- `GET /doctor-schedules/:doctorId` → `{ summary: 'Danh sách ca khám theo bác sĩ' }`
- `PATCH /doctor-schedules/:doctorScheduleId` → `{ summary: 'Cập nhật ca khám' }`
- `PATCH /doctor-schedules/:doctorScheduleId/status` → `{ summary: 'Bật/tắt kích hoạt ca khám' }`
- `DELETE /doctor-schedules/:doctorScheduleId` → `{ summary: 'Xóa ca khám' }`

- [x] **Step 5: `doctors.controller.ts`**

Add above `@Controller('doctors')`:

```ts
@ApiTags('doctors')
```

Add `@ApiCookieAuth()` to the guarded create, detail, update, and delete routes only.

Routes:
- `POST /doctors/create` → `{ summary: 'Tạo hồ sơ bác sĩ' }`
- `POST /doctors` → `{ summary: 'Danh sách bác sĩ (phân trang, lọc)' }`
- `GET /doctors/outstanding-doctors` → `{ summary: 'Danh sách bác sĩ nổi bật' }`
- `GET /doctors/:doctorId` → `{ summary: 'Chi tiết bác sĩ' }`
- `PATCH /doctors/:doctorId` → `{ summary: 'Cập nhật hồ sơ bác sĩ' }`
- `DELETE /doctors/:doctorId` → `{ summary: 'Xóa hồ sơ bác sĩ' }`

- [x] **Step 6: Verify it builds**

Run: `npm --prefix backend run build`
Expected: succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/chat-history/chat-history.controller.ts backend/src/modules/complaints/complaints.controller.ts backend/src/modules/dashboard/dashboard.controller.ts backend/src/modules/doctor-schedules/doctor-schedules.controller.ts backend/src/modules/doctors/doctors.controller.ts
git commit -m "feat(backend): add Swagger tags/operations/auth decorators — group B"
```

---

### Task 4: group C (examination-result, health-profile, messages, notifications, otps)

**Files:**
- Modify: `backend/src/modules/examination-result/examination-result.controller.ts`
- Modify: `backend/src/modules/health-profile/health-profile.controller.ts`
- Modify: `backend/src/modules/messages/messages.controller.ts`
- Modify: `backend/src/modules/notifications/notifications.controller.ts`
- Modify: `backend/src/modules/otps/otps.controller.ts`

`examination-result`, `health-profile`, `messages`, `notifications` have class-level `@UseGuards(JwtAuthGuard, PermissionsGuard)` → get class-level `@ApiCookieAuth()`. `otps` has **no guard at all** → `@ApiTags` only, no `@ApiCookieAuth()` anywhere in that file.

- [x] **Step 1: `examination-result.controller.ts`**

Add above `@Controller('examination-result')`:

```ts
@ApiTags('examination-result')
@ApiCookieAuth()
```

Routes:
- `POST /examination-result/create` → `{ summary: 'Tạo kết quả khám' }`
- `POST /examination-result` → `{ summary: 'Danh sách kết quả khám (phân trang, lọc)' }`
- `POST /examination-result/personal/list` → `{ summary: 'Danh sách kết quả khám cá nhân' }`
- `POST /examination-result/personal/doctor/list` → `{ summary: 'Danh sách kết quả khám do bác sĩ đang đăng nhập tạo' }`
- `GET /examination-result/:resultId` → `{ summary: 'Chi tiết kết quả khám' }`
- `PATCH /examination-result/:resultId` → `{ summary: 'Cập nhật kết quả khám' }`
- `DELETE /examination-result/:resultId` → `{ summary: 'Xóa kết quả khám' }`

- [x] **Step 2: `health-profile.controller.ts`**

Add above `@Controller('health-profiles')`:

```ts
@ApiTags('health-profiles')
@ApiCookieAuth()
```

Routes:
- `POST /health-profiles/admin/list` → `{ summary: 'Danh sách hồ sơ sức khỏe (admin, phân trang, lọc)' }`
- `POST /health-profiles/patient/list` → `{ summary: 'Danh sách hồ sơ sức khỏe của bệnh nhân đang đăng nhập' }`
- `GET /health-profiles/:relativeId` → `{ summary: 'Chi tiết hồ sơ sức khỏe theo người thân' }`
- `PATCH /health-profiles/update/:id` → `{ summary: 'Cập nhật hồ sơ sức khỏe' }`

- [x] **Step 3: `messages.controller.ts`**

Add above `@Controller('messages')`:

```ts
@ApiTags('messages')
@ApiCookieAuth()
```

Routes:
- `POST /messages` → `{ summary: 'Gửi tin nhắn' }`
- `GET /messages/:channelId` → `{ summary: 'Danh sách tin nhắn theo kênh' }`

- [x] **Step 4: `notifications.controller.ts`**

Add above `@Controller('notifications')`:

```ts
@ApiTags('notifications')
@ApiCookieAuth()
```

Routes:
- `POST /notifications/create` → `{ summary: 'Tạo thông báo' }`
- `POST /notifications` → `{ summary: 'Danh sách thông báo (phân trang, lọc)' }`
- `GET /notifications/:notificationId` → `{ summary: 'Chi tiết thông báo' }`
- `PATCH /notifications/:notificationId` → `{ summary: 'Cập nhật thông báo' }`
- `PATCH /notifications/:notificationId/notified` → `{ summary: 'Đánh dấu thông báo đã đọc' }`
- `DELETE /notifications/:notificationId` → `{ summary: 'Xóa thông báo' }`

- [x] **Step 5: `otps.controller.ts`** (public — no `@ApiCookieAuth()`)

Add above `@Controller('otps')`:

```ts
@ApiTags('otps')
```

Routes:
- `POST /otps/send-otp` → `{ summary: 'Gửi mã OTP' }`
- `POST /otps/verify-otp` → `{ summary: 'Xác thực mã OTP' }`

- [x] **Step 6: Verify it builds**

Run: `npm --prefix backend run build`
Expected: succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/examination-result/examination-result.controller.ts backend/src/modules/health-profile/health-profile.controller.ts backend/src/modules/messages/messages.controller.ts backend/src/modules/notifications/notifications.controller.ts backend/src/modules/otps/otps.controller.ts
git commit -m "feat(backend): add Swagger tags/operations/auth decorators — group C"
```

---

### Task 5: group D (permissions, relationships, relatives, role-permission, roles)

**Files:**
- Modify: `backend/src/modules/permissions/permissions.controller.ts`
- Modify: `backend/src/modules/relationships/relationships.controller.ts`
- Modify: `backend/src/modules/relatives/relatives.controller.ts`
- Modify: `backend/src/modules/role-permission/role-permission.controller.ts`
- Modify: `backend/src/modules/roles/roles.controller.ts`

Four controllers have class-level guards. `relationships` mixes public and guarded routes, so cookie auth is applied only to its guarded create/update/delete endpoints.

- [x] **Step 1: `permissions.controller.ts`**

Add above `@Controller('permissions')`:

```ts
@ApiTags('permissions')
@ApiCookieAuth()
```

Routes:
- `POST /permissions` → `{ summary: 'Tạo quyền' }`
- `GET /permissions/:permissionId` → `{ summary: 'Chi tiết quyền' }`

- [x] **Step 2: `relationships.controller.ts`**

Add above `@Controller('relationships')`:

```ts
@ApiTags('relationships')
```

Add `@ApiCookieAuth()` to the guarded create, update, and delete routes only.

Routes:
- `POST /relationships/create` → `{ summary: 'Tạo loại quan hệ' }`
- `POST /relationships` → `{ summary: 'Danh sách loại quan hệ (phân trang, lọc)' }`
- `GET /relationships/:relationshipCode` → `{ summary: 'Chi tiết loại quan hệ' }`
- `PATCH /relationships/:relationshipCode` → `{ summary: 'Cập nhật loại quan hệ' }`
- `DELETE /relationships/:relationshipCode` → `{ summary: 'Xóa loại quan hệ' }`

- [x] **Step 3: `relatives.controller.ts`**

Add above `@Controller('relatives')`:

```ts
@ApiTags('relatives')
@ApiCookieAuth()
```

Routes:
- `POST /relatives/admin/relatives` → `{ summary: 'Tạo người thân hộ (admin)' }`
- `POST /relatives` → `{ summary: 'Thêm người thân' }`
- `GET /relatives/patient/relatives` → `{ summary: 'Danh sách người thân của bệnh nhân đang đăng nhập' }`
- `GET /relatives/:relativeId` → `{ summary: 'Chi tiết người thân' }`
- `PATCH /relatives/:relativeId` → `{ summary: 'Cập nhật thông tin người thân' }`
- `DELETE /relatives/:relativeId` → `{ summary: 'Xóa người thân' }`

- [x] **Step 4: `role-permission.controller.ts`**

Add above `@Controller('role-permission')`:

```ts
@ApiTags('role-permission')
@ApiCookieAuth()
```

Routes:
- `GET /role-permission/matrix` → `{ summary: 'Ma trận vai trò-quyền' }`

- [x] **Step 5: `roles.controller.ts`**

Add above `@Controller('roles')`:

```ts
@ApiTags('roles')
@ApiCookieAuth()
```

Routes:
- `POST /roles/create-role` → `{ summary: 'Tạo vai trò' }`
- `POST /roles` → `{ summary: 'Danh sách vai trò (phân trang, lọc)' }`
- `GET /roles/:roleId` → `{ summary: 'Chi tiết vai trò' }`
- `PATCH /roles/:roleId` → `{ summary: 'Cập nhật vai trò' }`
- `PUT /roles/:roleId/permissions` → `{ summary: 'Gán quyền cho vai trò' }`
- `DELETE /roles/:roleId/permissions` → `{ summary: 'Gỡ quyền khỏi vai trò' }`

- [x] **Step 6: Verify it builds**

Run: `npm --prefix backend run build`
Expected: succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/permissions/permissions.controller.ts backend/src/modules/relationships/relationships.controller.ts backend/src/modules/relatives/relatives.controller.ts backend/src/modules/role-permission/role-permission.controller.ts backend/src/modules/roles/roles.controller.ts
git commit -m "feat(backend): add Swagger tags/operations/auth decorators — group D"
```

---

### Task 6: group E (satisfaction-rating, specialties, tags, topics, users, uploads)

**Files:**
- Modify: `backend/src/modules/satisfaction-rating/satisfaction-rating.controller.ts`
- Modify: `backend/src/modules/specialties/specialties.controller.ts`
- Modify: `backend/src/modules/tags/tags.controller.ts`
- Modify: `backend/src/modules/topics/topics.controller.ts`
- Modify: `backend/src/modules/users/users.controller.ts`
- Modify: `backend/src/uploads/uploads.controller.ts`

Four controllers have class-level guards. `specialties` and `topics` mix public and guarded routes, so cookie auth is applied per guarded route.

- [x] **Step 1: `satisfaction-rating.controller.ts`**

Add above `@Controller('satisfaction-rating')`:

```ts
@ApiTags('satisfaction-rating')
@ApiCookieAuth()
```

Routes:
- `POST /satisfaction-rating/create-rating` → `{ summary: 'Đánh giá mức độ hài lòng' }`
- `POST /satisfaction-rating` → `{ summary: 'Danh sách đánh giá (phân trang, lọc)' }`
- `GET /satisfaction-rating/:ratingId` → `{ summary: 'Chi tiết đánh giá' }`
- `PATCH /satisfaction-rating/:ratingId` → `{ summary: 'Cập nhật đánh giá' }`

- [x] **Step 2: `specialties.controller.ts`**

Add above `@Controller('specialties')`:

```ts
@ApiTags('specialties')
```

Add `@ApiCookieAuth()` to the guarded create, detail, update, and delete routes only.

Routes:
- `POST /specialties/create-specialty` → `{ summary: 'Tạo chuyên khoa' }`
- `POST /specialties` → `{ summary: 'Danh sách chuyên khoa (phân trang, lọc)' }`
- `GET /specialties/:specialtyId` → `{ summary: 'Chi tiết chuyên khoa' }`
- `PATCH /specialties/:specialtyId` → `{ summary: 'Cập nhật chuyên khoa' }`
- `DELETE /specialties/:specialtyId` → `{ summary: 'Xóa chuyên khoa' }`

- [x] **Step 3: `tags.controller.ts`**

Add above `@Controller('tags')`:

```ts
@ApiTags('tags')
@ApiCookieAuth()
```

Routes:
- `POST /tags/create-tag` → `{ summary: 'Tạo tag' }`
- `POST /tags` → `{ summary: 'Danh sách tag (phân trang, lọc)' }`
- `GET /tags/:tagId` → `{ summary: 'Chi tiết tag' }`
- `PATCH /tags/:tagId` → `{ summary: 'Cập nhật tag' }`
- `DELETE /tags/:tagId` → `{ summary: 'Xóa tag' }`

- [x] **Step 4: `topics.controller.ts`**

Add above `@Controller('topics')`:

```ts
@ApiTags('topics')
```

Add `@ApiCookieAuth()` to the guarded create, detail, update, and delete routes only.

Routes:
- `POST /topics/create-topic` → `{ summary: 'Tạo chủ đề' }`
- `POST /topics` → `{ summary: 'Danh sách chủ đề (phân trang, lọc)' }`
- `GET /topics/:topicId` → `{ summary: 'Chi tiết chủ đề' }`
- `PATCH /topics/:topicId` → `{ summary: 'Cập nhật chủ đề' }`
- `DELETE /topics/:topicId` → `{ summary: 'Xóa chủ đề' }`

- [x] **Step 5: `users.controller.ts`**

Add above `@Controller('users')`:

```ts
@ApiTags('users')
@ApiCookieAuth()
```

Routes:
- `POST /users/create` → `{ summary: 'Tạo người dùng (admin)' }`
- `POST /users/users` → `{ summary: 'Danh sách người dùng (phân trang, lọc)' }`
- `POST /users/patients` → `{ summary: 'Danh sách bệnh nhân (phân trang, lọc)' }`
- `GET /users` → `{ summary: 'Danh sách người dùng (không phân trang)' }`
- `GET /users/info` → `{ summary: 'Thông tin người dùng đang đăng nhập' }`
- `GET /users/:userId` → `{ summary: 'Chi tiết người dùng' }`
- `PATCH /users/update-info` → `{ summary: 'Cập nhật thông tin cá nhân' }`
- `PUT /users/change-password` → `{ summary: 'Đổi mật khẩu' }`
- `PATCH /users/:userId/roles` → `{ summary: 'Gán vai trò cho người dùng' }`
- `PATCH /users/:userId/lock` → `{ summary: 'Khóa tài khoản' }`
- `PATCH /users/:userId/unlock` → `{ summary: 'Mở khóa tài khoản' }`
- `PATCH /users/:userId/activate` → `{ summary: 'Kích hoạt tài khoản' }`
- `PATCH /users/:userId/deactivate` → `{ summary: 'Vô hiệu hóa tài khoản' }`

- [x] **Step 6: `uploads.controller.ts`**

Add above `@Controller('uploads')`:

```ts
@ApiTags('uploads')
@ApiCookieAuth()
```

Routes:
- `POST /uploads/articles/files` → `{ summary: 'Upload file đính kèm bài viết' }`
- `POST /uploads/messages/files` → `{ summary: 'Upload file đính kèm tin nhắn' }`

- [x] **Step 7: Verify it builds**

Run: `npm --prefix backend run build`
Expected: succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/satisfaction-rating/satisfaction-rating.controller.ts backend/src/modules/specialties/specialties.controller.ts backend/src/modules/tags/tags.controller.ts backend/src/modules/topics/topics.controller.ts backend/src/modules/users/users.controller.ts backend/src/uploads/uploads.controller.ts
git commit -m "feat(backend): add Swagger tags/operations/auth decorators — group E"
```

---

### Task 7: Manual verification against a running server

**Files:** none (verification only)

- [x] **Step 1: Start the backend and load the docs page**

Run: `npm --prefix backend run start:dev` (or, if already running via Docker, just recreate the container: `docker compose -f docker-compose.dev.yml up -d --build backend`)

Open `http://localhost:3000/api-docs` (native) or `http://localhost:3010/api-docs` (Docker) in a browser.

Expected: endpoints are grouped into the 26 tags added across Tasks 2-6 (no more flat undifferentiated list); expanding any endpoint shows a summary and a request/response schema derived from its DTOs.

- [ ] **Step 2: Verify the cookie-auth flow**

Log in via `POST /auth/login` from the Swagger UI's "Try it out" (or a separate tab against the same origin so the `accessToken` cookie is set), click "Authorize" in Swagger UI, then "Try it out" on any `@ApiCookieAuth()`-guarded route (e.g. `GET /users/info`).

Expected: the guarded route succeeds (200) using the browser's session cookie rather than requiring a manually pasted token.

- [x] **Step 3: Nothing to commit**

This task is a manual verification checkpoint. If Step 1 or 2 surfaces a decorator placed on the wrong route (e.g. the `role-permission` vs `roles` caveat in Task 5), fix it in that task's file and commit the fix there.
