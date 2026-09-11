# API specification — AS-IS

## HTTP conventions (backend)

- Base path: `/api/v1`. Swagger tại `/api-docs`.
- Envelope thành công: `{ statusCode, success: true, data, error: null }` (`ResponseInterceptor`), bỏ qua nếu `headersSent` (redirect Google OAuth, hoặc controller tự `res.status().json()` như 4 action của `AuthController`).
- Envelope lỗi (`HttpExceptionFilter`, mọi lỗi đều qua đây): `{ statusCode, status, success: false, data: null, error: { code, details } }`. Lỗi validation (mảng message từ `ValidationPipe`, status 400) → `code: 'VALIDATION_FAILED'`, `details` là mảng lỗi từng field. Lỗi không phải `HttpException` → luôn trả `500`/`INTERNAL_SERVER_ERROR` chung chung, log chi tiết chỉ ở server (không rò rỉ nội bộ ra client).
- `ValidationPipe({ transform:true, whitelist:true })` — không có `forbidNonWhitelisted`: field lạ bị **âm thầm loại bỏ**, không bị từ chối.
- Auth qua cookie (`withCredentials`); một số route nhận thêm `Authorization: Bearer` làm fallback cho access token.
- CORS allow-list cố định 10 origin (5173/4173/5000/5183/4183 × localhost/127.0.0.1); không giới hạn `methods` — `[UNCERTAIN]` có chủ ý hay không.

## Backend route catalogue — đầy đủ theo permission (nguồn: đọc trực tiếp từng `*.controller.ts`)

Mọi path dưới đây cần thêm tiền tố `/api/v1`. Cột "Guard" ghi `Jwt+Perm` nghĩa là class-level `@UseGuards(JwtAuthGuard, PermissionsGuard)`; "none" nghĩa là route không có guard nào (public thật sự, xác nhận không phải thiếu sót — xem `permissions.md`).

### auth (không class-level guard, guard theo từng route)
| Method | Path | Guard | Rate limit |
|---|---|---|---|
| POST | `/auth/register` | none | `accountChange` 3/10min |
| POST | `/auth/login` | `LocalAuthGuard` | `login` 5/min |
| POST | `/auth/admin/login` | `LocalAuthGuard` | `login` 5/min |
| POST | `/auth/refresh` | `JwtRefreshAuthGuard` | `refresh` 10/min |
| POST | `/auth/logout` | Jwt+Perm (`auth:logout`) | — |
| POST | `/auth/logout-all` | Jwt+Perm (`auth:logout`) | — |
| GET | `/auth/google` | `GoogleAuthGuard` | — |
| GET | `/auth/google/redirect` | `GoogleAuthGuard` | — |
| POST | `/auth/set-new-password` | none | `accountChange` |

### otps (hoàn toàn public, chỉ rate-limit)
`POST /otps/send-otp` (`accountChange` 3/10min), `POST /otps/verify-otp` (`otpVerification` 5/5min).

### appointments (class-level Jwt+Perm)
| Method | Path | Permission |
|---|---|---|
| POST | `/appointments/booking` | `appointment:create` |
| DELETE | `/appointments/cancel/:id` | `appointment:cancel` |
| POST | `/appointments/personal-appointments` | `appointment:read` |
| GET | `/appointments/:appointmentId` | `appointment:read` |
| POST | `/appointments/admin/appointments` | `appointment:manage` |
| POST | `/appointments/doctor/appointments` | `appointment:manage` (`[CONFLICT]` — bug đã biết, xem `known-ambiguities.md`; `admin/` né bằng cách gọi route admin thay thế) |
| PATCH | `/appointments/:appointmentId/status` | `appointment:update-status` |

### doctors (không class-level guard, per-route)
| Method | Path | Guard/Permission |
|---|---|---|
| POST | `/doctors` (list, filter/paginate) | public |
| POST | `/doctors/create` | `doctor:create` |
| GET | `/doctors/outstanding-doctors` | public |
| GET | `/doctors/:doctorId` | `doctor:read` |
| PATCH | `/doctors/:doctorId` | `doctor:update` |
| DELETE | `/doctors/:doctorId` | `doctor:delete` |

### doctor-schedules (class-level Jwt+Perm)
`POST /doctor-schedules/personal-schedules` (`doctor-schedule:read`), `POST /doctor-schedules/create-schedule` (`:create`), `GET /doctor-schedules/:doctorId` (`:read`), `PATCH /doctor-schedules/:doctorScheduleId` (`:update`), `PATCH /doctor-schedules/:doctorScheduleId/status` (`:update-status`), `DELETE /doctor-schedules/:doctorScheduleId` (`:delete`).

### users (class-level Jwt+Perm)
`GET /users` (`user:manage`), `GET /users/info` (`user:read`), `PATCH /users/update-info` (`user:update`), `PUT /users/change-password` (`user:update`), `POST /users` (`user:manage`), `POST /users/create` (`user:create`), `POST /users/patients` (`patient:read`), `GET/PATCH /users/:userId` (`user:manage`), `PATCH /users/:userId/lock|unlock|activate|deactivate` (permission tương ứng), `PATCH /users/:userId/roles` (`user:update-role`).

### relatives (class-level Jwt+Perm)
`POST /relatives` (`relative:create`), `GET /relatives/patient/relatives` (`:read`), `GET /relatives/:relativeId` (`:read`), `PATCH /relatives/:relativeId` (`:update`), `DELETE /relatives/:relativeId` (`:delete`), `POST /relatives/admin/relatives` (`:manage`).

### relationships (không class-level guard)
`POST /relationships` (list, public), `POST /relationships/create` (`relationship:create`), `GET /relationships/:relationshipCode` (public), `PATCH .../:relationshipCode` (`:update`), `DELETE .../:relationshipCode` (`:delete`).

### health-profiles (class-level Jwt+Perm)
`POST /health-profiles/patient/list` (`:read`), `PATCH /health-profiles/update/:id` (`:update`), `GET /health-profiles/:relativeId` (`:read`), `POST /health-profiles/admin/list` (`:manage`).

### coach-profile (class-level Jwt+Perm — 1 permission duy nhất cho cả module)
`GET /coach-profile/me`, `POST /coach-profile`, `PATCH /coach-profile` → tất cả `coach-profile:manage`.

### admin-reports
`POST /admin-reports/generate` (`ai-coach-report:read`) — không query DB trực tiếp, forward câu hỏi ngôn ngữ tự nhiên tới chatbot `POST /chatbot/create-report` kèm header `x-chatbot-internal-key`, timeout 240s.

### articles (không class-level guard)
`POST /articles/create-article` (`article:create`), `PATCH /articles/:articleId` (`:update`), `DELETE /articles/:articleId` (`:delete`), `GET /articles/:articleId` (public), `PUT /articles/:articleId` (approve, `article:approve`), `POST /articles` (list, public — `[CONFLICT]` chấp nhận filter `is_approve=false` không xác thực).

### topics (không class-level guard)
`POST /topics` (list, public), `POST /topics/create-topic` (`:create`), `GET/:topicId` (`:read`), `PATCH/:topicId` (`:update`), `DELETE/:topicId` (`:delete`).

### tags (class-level Jwt+Perm)
`POST /tags` (list, `tag:read`), `POST /tags/create-tag` (`:create`), `GET/:tagId` (`:read`), `PATCH/:tagId` (`:update`), `DELETE/:tagId` (`:delete`).

### specialties (không class-level guard)
`POST /specialties/create-specialty` (`:create`), `PATCH/:specialtyId` (`:update`), `DELETE/:specialtyId` (`:delete`), `GET/:specialtyId` (`:read`), `POST /specialties` (list, public).

### roles / permissions / role-permission (class-level Jwt+Perm)
- `roles`: `POST /roles` (list, `role:read`), `POST /roles/create-role` (`:create`), `GET/:roleId` (`:read`), `PATCH/:roleId` (`:update`), `PUT/:roleId/permissions` (`role-permission:update`), `DELETE/:roleId/permissions` (`role-permission:update`).
- `permissions`: `POST /permissions` (list, `permission:read`), `GET/:permissionId` (`:read`). Không có create/update/delete qua API.
- `role-permission`: `GET /role-permission/matrix` (`role-permission:read`).

### messages / channels (class-level Jwt+Perm)
`POST /messages` (`message:create`), `GET /messages/:channelId` (`:read`), `PATCH /messages/:channelId/read` (`:update`); `POST /channels/create` (`channel:create`), `POST /channels/personal-channels` (`:read`), `GET /channels/:channelId` (`:read`).

### notifications (class-level Jwt+Perm)
`GET /notifications/me` / `me/unread-count` (`:read`), `PATCH /notifications/me/:id/read` / `me/read-all` (`:read`), `GET /notifications/recipients` (`:create`), `POST /notifications` (admin list, `:manage`), `POST /notifications/create` (`:create`), `GET /notifications/:id` (`:manage`), `PATCH /notifications/:id` (`:update`), `DELETE /notifications/:id` (`:delete`).

### examination-result (class-level Jwt+Perm)
`POST /examination-result` (list, `:read`), `POST /examination-result/create` (`:create`), `POST /examination-result/personal/list` / `personal/doctor/list` (`:read`), `GET/:resultId` (`:read`), `PATCH/:resultId` (`:update`), `DELETE/:resultId` (`:delete`).

### satisfaction-rating (class-level Jwt+Perm)
`POST /satisfaction-rating` (list, `:manage`), `POST /satisfaction-rating/create-rating` (`:create`), `GET/:ratingId` (`:read`, + ownership-or-manage), `PATCH/:ratingId` (`:update`, + ownership-or-manage). **Không có route DELETE** (`SatisfactionRatingService.delete()` là stub rỗng, `[NOT IMPLEMENTED]`).

### audit-logs
`POST /audit-logs` (filter/list, `audit-log:read`).

### complaints (class-level Jwt+Perm)
`POST /complaints` (admin list, `:manage`), `POST /complaints/my` (`:read`), `POST /complaints/create` (`:create`), `GET/:complaintId` (`:read` + ownership-or-manage), `PATCH/:complaintId` (`:update`), `DELETE/:complaintId` (`:delete`).

### settings
`GET/PATCH /system-settings` (`setting:read`/`setting:manage`); `GET/PATCH /user-settings/me` (`setting:read`/`setting:update`).

### dashboard (class-level Jwt+Perm)
`GET /dashboard/patient` (`dashboard:patient`), `GET /dashboard/doctor` (`dashboard:doctor` — `[CONFLICT]` `doctorId` luôn undefined, xem `known-ambiguities.md`), `GET /dashboard/admin` (`dashboard:admin`).

### chat-history (class-level Jwt+Perm, tất cả → `chatbot:chat`; bridge sang service `chatbot/`)
| Path | Ghi chú |
|---|---|
| `GET /chat-history/context/:userId` | yêu cầu `userId === req.user.userId` |
| `POST /chat-history` | lưu 1 message |
| `POST /chat-history/chat` | forward `{question, token}` tới chatbot `POST /chatbot/chat`, timeout 30s |
| `POST /chat-history/build-health-roadmap` | forward tới `POST /chatbot/build-health-roadmap`, timeout 30s |
| `POST /chat-history/summary-medical-record` | multipart, forward tới `POST /chatbot/upload/summary-medical-record`, timeout 120s, gửi token dưới dạng Bearer header (khác 2 route kia gửi token trong JSON body — `[UNCERTAIN]` có chủ ý) |
| `GET /chat-history/:userId` | yêu cầu `userId === req.user.userId` |

### uploads (class-level Jwt+Perm)
`POST /uploads/messages/files` (`message:create` + kiểm tra chủ sở hữu message trước khi upload), `POST /uploads/articles/files` (`article:create` + kiểm tra tác giả-hoặc-`article:manage`). Cả hai trả `202 Accepted` ngay, xử lý thật (Cloudinary + ghi DB + emit realtime) chạy async qua BullMQ.

## Chatbot HTTP API (`chatbot/`, mount tại `/chatbot`)

| Method | Path | Rate limit (bucket, max/60s) | Auth theo user? |
|---|---|---|---|
| POST | `/chatbot/chat` | `chat`, 120 | Có (nếu `token` gửi kèm) |
| POST | `/chatbot/create-report` | `report`, 12 | **Không** — chỉ internal-service-key, rate-limit theo IP |
| POST | `/chatbot/build-health-roadmap` | `health-roadmap`, 12 | Có |
| POST | `/chatbot/upload/summary-medical-record` | `upload`, 12 | Có (Bearer header) |

Mọi route đều bắt buộc header `x-chatbot-internal-key` khớp `CHATBOT_INTERNAL_KEY` (so sánh hằng thời gian, SHA-256 + `timingSafeEqual`), nếu không → 401/503.

**`POST /chatbot/diagnosis` KHÔNG tồn tại** dù `handleDiagnosisController`/`handleDiagnosisService`/`diagnosisGraph` được implement đầy đủ ở code — route không bao giờ được đăng ký (`chatbot/src/routes/chatbot.route.ts` chỉ đăng ký 4 route trên). Xác nhận `[DEAD CODE]` bởi chính test tích hợp (`test/integration/chatbot.route.integration.spec.ts:66-68` mock hàm này để throw "Diagnosis is not exposed by the production router").

Upload multipart nhận field `images` (tối đa 5, ≤10MB/file, kiểm tra magic-byte JPEG/PNG/WebP) HOẶC `pdf` (1 file, kiểm tra header `%PDF-`) — XOR bắt buộc (`middlewares/xorValidate.ts`).

## Cross-service HTTP calls do `chatbot/` chủ động gọi ngược `backend/`

Không dùng client HTTP dùng chung — mỗi tool/graph tự gọi `axios` trực tiếp tới `process.env.BACKEND_URL`:

| Caller | Method + path | Auth gửi kèm |
|---|---|---|
| `langgraph/booking.graph.ts` (đặt lịch qua chat) | `POST /api/v1/appointments/booking` | `Authorization: Bearer <token>`, `booking_mode: "ai_select"` |
| `tools/relative_analyzer.tool.ts` | `GET /api/v1/relatives/patient/relatives` | Bearer |
| `tools/specialty_name_analyzer.tool.ts` | `POST /api/v1/specialties` | không có header auth |
| `tools/get_health_profile.tool.ts` | `GET /api/v1/health-profiles/:relativeId` | Bearer |
| `services/chatbot.service.ts` | `POST`/`GET /api/v1/chat-history*` | Bearer |

`[UNCERTAIN]` lệnh gọi đặt lịch (`booking.graph.ts`) không đặt `timeout` tường minh trên axios, khác với hầu hết lệnh gọi khác trong cùng service (đa số có timeout 10s) — có thể là thiếu sót đối chiếu với chính sách "luôn set timeout" ghi trong comment `chatbot.service.ts`.

## WebSocket API (`backend/src/websockets/websocket.gateway.ts`)

- Xác thực: cookie `accessToken`, xác minh lại **mỗi event** (không chỉ lúc connect) qua `WsCookieAuthGuard`.
- Client events: `channel:join` (kiểm tra thành viên kênh), `channel:leave`, `send:message` (rate-limit riêng 30/min).
- Server events: `appointment:success`/`appointment:fail`/`appointment:slotBooked` (slotBooked broadcast toàn cục để mọi client đang xem cùng bác sĩ thấy slot biến mất live), `updated:message:files`, `updated:article:files`, `notification:new`/`updated`/`deleted`/`read-all`.
- Rate limit riêng cho WebSocket: connection 20/min, event mặc định 60/min, sendMessage 30/min — Redis-backed, **fail-open** nếu Redis lỗi (route HTTP cũng fail-open tương tự theo tên class `FailOpenThrottlerStorage`, chưa verify code chi tiết).
- Mỗi socket 1 client id trong map nội bộ theo userId (không theo dõi đa thiết bị/tab cùng lúc trong map này — nhưng phòng Socket.IO theo `user:<id>` vẫn hoạt động đúng cho nhiều socket).

**Implementation Evidence**

- `backend/src/modules/**/*.controller.ts`, `backend/src/uploads/uploads.controller.ts`, `backend/src/main.ts`
- `backend/src/common/filters/http-exception.filter.ts`, `backend/src/common/interceptors/response.interceptor.ts`
- `backend/src/websockets/websocket.gateway.ts`
- `chatbot/src/routes/chatbot.route.ts`, `chatbot/src/controllers/chatbot.controller.ts`, `chatbot/test/integration/chatbot.route.integration.spec.ts`
