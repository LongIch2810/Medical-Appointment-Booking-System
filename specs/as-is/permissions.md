# Permissions and security model — AS-IS

## Authentication

Backend có local auth, admin login, refresh, logout, logout-all, Google OAuth và password reset (OTP-based).

- Access JWT đọc từ cookie `accessToken` **hoặc** header `Authorization: Bearer` (fallback); refresh JWT chỉ đọc từ cookie `refreshToken` (không có fallback header) — `backend/src/modules/auth/jwt.strategy.ts`, `refresh.strategy.ts`.
- Cookie: `accessToken` maxAge 15 phút, `refreshToken` maxAge 7 ngày (`backend/src/utils/constants.ts:149-150`), cả hai `httpOnly:true`, `sameSite:'strict'`, `secure` = `NODE_ENV==='production'` (`backend/src/utils/cookieOptions.ts:10-25`). Các hằng số maxAge này **độc lập** với thời hạn dùng để ký JWT (`ACCESS_TOKEN_EXPIRE`/`REFRESH_TOKEN_EXPIRE` từ env) — `[UNCERTAIN]` liệu 2 giá trị này luôn được giữ đồng bộ vận hành.
- `SessionAuthService.assertSessionValid`: so khớp chính xác `sessionVersion` trong JWT với `session_version:<userId>` trong Redis, và kiểm tra `blacklist:<tokenId>` — dùng chung cho cả HTTP strategies và WebSocket (`validateAccessToken`, xác minh chữ ký thủ công).
- Local login (`AuthService.validateUser`): tra theo username-hoặc-email; nếu user không có password (tài khoản Google-only) → báo lỗi hướng dẫn dùng Google/quên-mật-khẩu; so khớp bcrypt.
- `login` (patient, `/auth/login`): yêu cầu `roles.includes('PATIENT')` — từ chối tài khoản chỉ có role staff.
- `loginAdministrator` (`/auth/admin/login`): từ chối chỉ khi `roles.length===1 && roles.includes('PATIENT')` — tài khoản có ADMIN và/hoặc DOCTOR (kể cả kết hợp PATIENT) đều dùng được endpoint này.
- Refresh token: **rotation** mỗi lần dùng (tokenId cũ bị blacklist, tokenId mới được cấp và lưu). Danh sách phiên hoạt động lưu ở Redis list `refresh_tokens:<userId>`.
- `MAX_DEVICES=3` nhưng điều kiện loại bỏ phiên cũ là `sessions.length > 3` **trước khi** thêm phiên mới → cho phép tối đa 4 phiên đồng thời trước khi phiên cũ nhất bị blacklist — xem `[CONFLICT]` trong `known-ambiguities.md`.
- Đổi mật khẩu (tự đổi hoặc qua OTP reset) đều tăng `session_version` và xóa `refresh_tokens` — đăng xuất mọi thiết bị khác.
- Đặt lại mật khẩu quên: `POST /otps/send-otp` → `POST /otps/verify-otp` (trả `resetToken` một lần dùng, hiệu lực 10 phút) → `POST /auth/set-new-password`. Cả gửi và xác minh OTP đều trả thông báo lỗi/generic giống nhau bất kể lý do thất bại (chống dò tài khoản); OTP tối đa 5 lần thử sai, hết hạn 5 phút.

## Guards (`backend/src/common/guards/`)

| Guard | Vai trò |
|---|---|
| `JwtAuthGuard` | `AuthGuard('jwt')`, gọi `JwtStrategy.validate` (đã kiểm tra session) |
| `JwtRefreshAuthGuard` | `AuthGuard('jwt-refresh')` |
| `LocalAuthGuard` | `AuthGuard('local')` |
| `GoogleAuthGuard` | `AuthGuard('google')`, ép `prompt=select_account`, `accessType=offline` |
| `PermissionsGuard` | Xem bên dưới |
| `WsCookieAuthGuard` | Xác thực lại cookie `accessToken` trên **mỗi** event WebSocket (không chỉ lúc connect) |

## Roles

Role constant xác nhận: `ADMIN` (role_code 10001), `DOCTOR` (10002), `PATIENT` (10003) — seed migration `1779638786395-seedData.ts`. Một user có thể giữ nhiều role. Admin frontend derive workspace role + lưu session/permission trong Zustand store `admin-auth-store` (`admin/src/store/useAuthStore.ts`).

## Permission enforcement (`PermissionsGuard`)

Thuật toán chính xác (`backend/src/common/guards/permissions.guard.ts`):
1. Đọc metadata `@Permissions(...)` qua `Reflector.getAllAndOverride` (handler + class). **Nếu không có metadata, guard cho qua** — route có `@UseGuards(PermissionsGuard)` nhưng không `@Permissions(...)` không bị chặn bởi guard này (chỉ còn phụ thuộc guard xác thực đứng trước, nếu có).
2. Yêu cầu `req.user` tồn tại (do `JwtAuthGuard` set) — nếu không → 401.
3. Gọi `RolePermissionService.getPermissionsByRoles(userId, roles)`; yêu cầu **tất cả** permission liệt kê phải có mặt (`.every(...)`) — `@Permissions(a, b)` là AND, không phải OR.
4. Không thỏa → 403 `'Bạn không có quyền truy cập!'`.

`RolePermissionService.getPermissionsByRoles`: cache Redis `permissions:<userId>` TTL 3600s; cache miss thì JOIN `role_permissions → permission → role WHERE role.role_name IN (:...roles)`. Cache bị xóa chủ động khi: sửa role của user (`UsersService.updateRoles`, chỉ xóa cache — **không** buộc đăng nhập lại) hoặc sửa permission của role (`RolesService.updateRolePermissions/deleteRolePermissions` → `invalidateRoleUsers`: xóa cache **và** tăng `session_version` + xóa `refresh_tokens` cho mọi user giữ role đó, buộc đăng nhập lại ngay). Hai đường này không đối xứng — xem `known-ambiguities.md`.

## Toàn bộ danh mục permission (91 chuỗi, nguồn `backend/src/utils/constants.ts:14-148`)

| Domain | Permissions |
|---|---|
| auth | `auth:login`, `:logout`, `:refresh`, `:register`, `:google-login`, `:set-password` |
| user | `user:create`, `:read`, `:update`, `:delete`, `:lock`, `:unlock`, `:activate`, `:deactivate`, `:update-role`, `:manage` |
| patient | `patient:create`, `:read`, `:update`, `:delete`, `:manage` |
| doctor | `doctor:create`, `:read`, `:update`, `:delete`, `:manage` |
| appointment | `appointment:create`, `:read`, `:update`, `:delete`, `:cancel`, `:update-status`, `:manage` |
| doctor-schedule | `doctor-schedule:create`, `:read`, `:update`, `:delete`, `:update-status`, `:manage` |
| role / permission / role-permission | `role:create/read/update/delete/manage`; `permission:create/read/update/delete/manage`; `role-permission:read/update/manage` |
| specialty / topic / tag | mỗi domain: `create/read/update/delete/manage` |
| article | `article:create/read/update/delete/approve/manage` |
| message / channel | mỗi domain: `create/read/update/delete/manage` |
| relative / relationship / health-profile | mỗi domain: `create/read/update/delete/manage` |
| coach-profile | `coach-profile:manage` (một permission duy nhất cho cả module self-service) |
| ai-coach-report | `ai-coach-report:read` |
| enterprise-report | `enterprise-report:read` (không backend route nào dùng — có thể chỉ dùng cho UI menu/mock hoặc dịch vụ khác) |
| examination-result / satisfaction-rating / complaint / notification | mỗi domain: bộ `create/read/update/delete(/send cho notification)/manage` |
| audit-log | `audit-log:read` (dùng), `audit-log:manage` (seed nhưng không route nào dùng) |
| dashboard | `dashboard:patient`, `:doctor`, `:admin` |
| setting | `setting:read`, `:update`, `:manage` |
| patient-record | `patient-record:read`, `:manage` (seed, gán cho DOCTOR, không backend route nào trong `backend/src/modules` dùng — khả năng dành cho chatbot hoặc UI-only) |
| chatbot | `chatbot:chat` |

Permission **có seed nhưng không route backend nào gate tới** (không kết luận là bug — xem `known-ambiguities.md`): `enterprise-report:read`, `notification:send`, `audit-log:manage`, `patient-record:read/manage`, và toàn bộ CRUD `permission:create/update/delete/manage` (chỉ có route list + detail cho permission, không có create/update/delete qua API — permission hoàn toàn quản lý qua migration).

## Seed permission mặc định theo role (migration `1779638786395-seedData.ts`, sau đó bị mở rộng)

- **ADMIN**: ban đầu seed toàn bộ 130 permission được tạo tại thời điểm đó. Migration `1787100000000-seedAdminFullPermissions.ts` sau đó CROSS JOIN ADMIN với **mọi** permission hiện có (kể cả những permission được thêm sau seed đầu) — mọi migration cấp permission mới về sau đều tự cấp lại tường minh cho ADMIN. Kết luận: **ADMIN luôn có 100% permission hiện có trong hệ thống**, không phải một danh sách tĩnh.
- **DOCTOR**: bộ auth cơ bản, `dashboard:doctor`, `user:read`, `doctor:read/update`, toàn bộ `doctor-schedule:*`, `appointment:read/update-status/manage`, `patient:read/manage`, `patient-record:read/manage`, `health-profile:read`, toàn bộ `examination-result:*`, `satisfaction-rating:read`, `message:create/read/manage`, `channel:create/read/manage`, toàn bộ `article:*` (kể cả `approve`), `topic:read/manage`, `tag:read/manage`, `notification:read`, `setting:read/update`, `chatbot:chat`.
- **PATIENT**: auth (gồm register/google-login/set-password), `dashboard:patient`, `user:read/update`, `patient:read`, `appointment:create/read/cancel`, toàn bộ `relative:*` trừ `manage`, `health-profile:create/read/update`, `examination-result:read`, `satisfaction-rating:create/read/update`, `message:create/read`, `channel:create/read`, `notification:read`, `complaint:create/read`, `relationship:read`, `specialty:read`, `doctor:read`, `doctor-schedule:read`, `article:read`, `topic:read`, `tag:read`, `chatbot:chat`.
- Migration sau đó cấp bổ sung không phân biệt danh sách gốc: `coach-profile:manage` → PATIENT + ADMIN; `ai-coach-report:read` → ADMIN only; `enterprise-report:read` → ADMIN only; `setting:read/update`, `notification:read` → **mọi** role (CROSS JOIN); `message:update` → DOCTOR + PATIENT (retroactively).

## RBAC ở tầng UI (`admin/`)

- `admin/src/config/permissions.ts` gần như sao chép nguyên văn danh mục permission backend (đối chiếu từng chuỗi: khớp toàn bộ, ngoại trừ backend permission `coach-profile:manage` không có counterpart nào trong UI admin — có thể được dùng riêng bởi chatbot service).
- `usePermission()` hook: `can(...candidates)` = OR (có ít nhất một permission trong danh sách); `canAll(...)` = AND. Quy ước phổ biến trong `GenericModulePage.tsx`: mỗi control kiểm tra `can(PERMISSIONS.<DOMAIN>_<ACTION>, PERMISSIONS.<DOMAIN>_MANAGE)` — permission hành động cụ thể HOẶC permission `manage` bao trùm của domain đều mở khóa control.
- `derivePermissions(user)`: đường chính lấy permission thật từ payload backend (`user.permissions` + permission lồng trong `user.roles[].permissions[]`). **Fallback** (chỉ dùng khi backend không trả permission tường minh — comment tự nhận "for older backends"): suy ra permission thuần từ tên role qua `adminPermissionSet`/`doctorPermissionSet` cứng trong code — `[UNCERTAIN]` các bộ fallback này có đồng bộ với seed backend hiện tại hay không, vì chỉ có tác dụng khi backend "cũ".
- `canAccessAdminConsole(user)`: cho vào console nếu `isAdmin` hoặc có **bất kỳ** role nào khác PATIENT — không chỉ ADMIN/DOCTOR; việc truy cập từng trang cụ thể vẫn do `PermissionRoute` (route-level) chặn tiếp theo permission yêu cầu của trang đó.
- Route `/account/settings` (`DoctorSettingsPage`, dùng chung cho mọi role) **không có `PermissionRoute`** — bất kỳ user đã đăng nhập nào cũng vào được, không phân biệt vai trò.

## Frontend route matrix

| Khu vực | Guard |
|---|---|
| Patient protected subtree (frontend) | `RouteProtected` — yêu cầu có session VÀ role `PATIENT`; không có role PATIENT → `/403` (không phải `/sign-in`) |
| Doctor/admin console (admin) | `ProtectedRoute` (yêu cầu session) → `PermissionRoute` theo từng route (yêu cầu permission cụ thể, ALL-of) |
| Backend controller action có metadata | `PermissionsGuard` (nguồn xác thực cuối cùng — UI chỉ là lớp trải nghiệm) |
| WebSocket | `WsCookieAuthGuard` (xác thực lại cookie mỗi event) + `WsRateLimitGuard` + kiểm tra thành viên kênh khi vào `channel:join`/gửi tin |

`admin/`: một số route công khai với BẤT KỲ role nào không phải patient (`/account/settings`); một số route chỉ yêu cầu 1 permission cụ thể của domain (bảng đầy đủ trong `api-spec.md`/`functional-spec.md`).

## Public (không guard) ở backend — xác nhận là chủ ý, không phải thiếu sót

`doctors.controller.ts` (list + outstanding-doctors), `articles.controller.ts` (list + detail), `topics.controller.ts` (list), `specialties.controller.ts` (list), `relationships.controller.ts` (list + detail) đều **không có class-level guard** — class-level guard bị cố tình bỏ (không phải chỉ thiếu `@Permissions`) — phù hợp với luồng duyệt catalogue công khai trước khi đăng nhập/đặt lịch. Ngoại lệ đáng chú ý: `POST /articles` (list) cho phép filter `is_approve=false` mà không guard — có thể lộ bài viết chưa duyệt cho khách ẩn danh, xem `known-ambiguities.md`.

`otps.controller.ts` hoàn toàn public (không guard), chỉ bảo vệ bằng rate limit riêng (`accountChange` 3/10min cho send, `otpVerification` 5/5min cho verify).

## Chatbot service — mô hình xác thực khác hẳn (không dùng RBAC nội bộ)

- Không có permission/role check nào bên trong `chatbot/` (không tương đương `@Permissions`/`PermissionsGuard`).
- Mọi route `/chatbot/*` đi qua 2 middleware bắt buộc: `requireInternalServiceKey` (so khớp header `x-chatbot-internal-key` với `CHATBOT_INTERNAL_KEY` bằng SHA-256 + `timingSafeEqual`, xác thực **service gọi tới** — thường là backend — không phải người dùng cuối) và `attachVerifiedActor` (nếu có `token`/Bearer, verify JWT bằng cùng `ACCESS_TOKEN_SECRET` của backend để lấy `actorUserId` dùng cho rate-limit theo user; nếu **không** có token, middleware này bỏ qua mà không chặn request).
- Hệ quả quan trọng: `POST /chatbot/create-report` không gửi kèm `token` nào → **không xác thực theo người dùng**, chỉ được bảo vệ bởi internal-service-key; rate-limit rơi về theo IP. Việc ai được phép trigger báo cáo admin phải được backend kiểm soát trước khi forward — không xác minh được từ phía `chatbot/`.

**Implementation Evidence**

- `backend/src/common/guards/permissions.guard.ts`, `jwtAuth.guard.ts`, `jwtRefreshAuth.guard.ts`, `wsCookieAuth.guard.ts`
- `backend/src/modules/auth/*`, `backend/src/modules/role-permission/role-permission.service.ts`, `backend/src/modules/roles/roles.service.ts`
- `backend/src/utils/constants.ts` (permission catalogue), `backend/src/utils/cookieOptions.ts`
- `backend/src/database/migrations/1779638786395-seedData.ts`, `1787100000000-seedAdminFullPermissions.ts`
- `admin/src/config/permissions.ts`, `admin/src/hooks/usePermission.ts`, `admin/src/store/useAuthStore.ts`, `admin/src/routes/AppRoutes.tsx`
- `frontend/src/routes/RouteProtected.tsx`
- `chatbot/src/middlewares/internalServiceAuth.ts`, `requestIdentity.ts`

## Admin report assistant ownership (2026-09)

The new assistant create/list/detail/message routes reuse `ai-coach-report:read`; no permission catalogue or seed change was added. In addition to the normal JWT/RBAC check, every conversation lookup includes both the conversation ID and authenticated `created_by_user_id`. One admin therefore cannot list, load, continue, or confirm another admin's conversation. The chatbot independently verifies the forwarded Bearer JWT subject against the body `userId` before using per-user rate-limit buckets.

LangGraph thread IDs are constructed server-side from the verified user ID and owned conversation ID; callers cannot supply an arbitrary thread. Long-term memory uses a namespace containing the verified admin ID, and the graph accepts only validated report-preference enums there. The chatbot's `chatbot_report_assistant` database role is isolated to its own `langgraph` schema and has no grants to business/report tables; the existing `chatbot_readonly` role remains the only chatbot role with SELECT access to the approved reporting views.

## Patient chat ownership and booking approval (2026-09)

Patient multi-thread routes reuse the existing `chatbot:chat` permission; no new permission was added. Backend conversation/message reads and writes include both the conversation ID and authenticated `user_id`, so a patient cannot list, load, continue, approve, or delete another patient's thread. The backend derives the LangGraph thread ID and forwards the current access token in the Bearer header. The chatbot rejects a missing/mismatched verified JWT subject and does not accept a caller-chosen thread ID.

Booking approval requires the newest `BOOKING_APPROVAL` message in the owned conversation and its stored operation ID/summary. A free-form “yes/agree” message never commits an appointment; it is treated as revision while a native approval interrupt is pending. The LangGraph database role is shared with the report assistant but remains limited to the `langgraph` schema; it cannot access patient-chat business tables or health-profile data. Patient long-term Store namespaces contain only a validated preference profile and include the verified patient ID.
