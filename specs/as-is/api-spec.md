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
| `POST /chat-history/chat` | tương thích ngược; chuyển câu hỏi qua conversation patient mới và safe patient-chat flow, không còn đường đặt lịch bỏ qua xác nhận |
| `POST /chat-history/build-health-roadmap` | forward tới `POST /chatbot/build-health-roadmap`, timeout 30s |
| `GET /chat-history/:userId` | yêu cầu `userId === req.user.userId` |

Các route multi-thread mới cũng dùng `chatbot:chat`; mọi đọc/ghi đều giới hạn theo user đã xác thực:

| Method and route | Contract |
|---|---|
| `POST /chat-history/conversations` | Tạo conversation rỗng, title mặc định “Cuộc trò chuyện mới”. |
| `GET /chat-history/conversations?page=1&limit=20` | Danh sách conversation của patient hiện tại, `limit` tối đa 50. |
| `GET /chat-history/conversations/:id?beforeMessageId=&limit=50` | Metadata và trang transcript theo cursor, tăng dần; `limit` tối đa 100. |
| `DELETE /chat-history/conversations/:id` | Xóa checkpoint LangGraph rồi soft-delete conversation nghiệp vụ; preference memory không bị xóa. |
| `POST /chat-history/conversations/:id/messages` | `{ message }`, hoặc `{ approvalMessageId, decision: APPROVE\|CANCEL }`. Tin thường khi còn booking approval sẽ resume như `REVISE`. |

Turn response gồm conversation, tin user (nếu có), tin assistant và appointment tùy chọn. Action gồm `ANSWER`, `CLARIFY`, `BOOKING_APPROVAL`, `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, `MEMORY_RESULT`, `REFUSE`.

### uploads (class-level Jwt+Perm)
`POST /uploads/messages/files` (`message:create` + kiểm tra chủ sở hữu message trước khi upload), `POST /uploads/articles/files` (`article:create` + kiểm tra tác giả-hoặc-`article:manage`). Cả hai trả `202 Accepted` ngay, xử lý thật (Cloudinary + ghi DB + emit realtime) chạy async qua BullMQ.

## Chatbot HTTP API (`chatbot/`, mount tại `/chatbot`)

| Method | Path | Rate limit (bucket, max/60s) | Auth theo user? |
|---|---|---|---|
| POST | `/chatbot/chat` | `chat`, 120 | Có (nếu `token` gửi kèm) |
| POST | `/chatbot/patient-chat` | `patient-chat`, 120 | Có — Bearer JWT bắt buộc, subject phải khớp `userId` |
| DELETE | `/chatbot/patient-chat/conversations/:conversationId` | `patient-chat`, 120 | Có — chỉ xóa checkpoint cho actor/conversation đã xác minh |
| POST | `/chatbot/create-report` | `report`, 12 | **Không** — chỉ internal-service-key, rate-limit theo IP |
| POST | `/chatbot/build-health-roadmap` | `health-roadmap`, 12 | Có |

Mọi route đều bắt buộc header `x-chatbot-internal-key` khớp `CHATBOT_INTERNAL_KEY` (so sánh hằng thời gian, SHA-256 + `timingSafeEqual`), nếu không → 401/503.

**`POST /chatbot/diagnosis` KHÔNG tồn tại** dù `handleDiagnosisController`/`handleDiagnosisService`/`diagnosisGraph` được implement đầy đủ ở code — route không bao giờ được đăng ký. Xác nhận `[DEAD CODE]` bởi test tích hợp mock hàm này để throw “Diagnosis is not exposed by the production router”.

`[REMOVED]` `POST /chatbot/upload/summary-medical-record` (multipart `images`/`pdf`, XOR bắt buộc qua `middlewares/xorValidate.ts`) từng tồn tại nhưng đã bị gỡ bỏ cùng toàn bộ tính năng tóm tắt bệnh án AI — xem `functional-spec.md` mục 4.

## Cross-service HTTP calls do `chatbot/` chủ động gọi ngược `backend/`

Không dùng client HTTP dùng chung — mỗi tool/graph tự gọi `axios` trực tiếp tới `process.env.BACKEND_URL`:

| Caller | Method + path | Auth gửi kèm |
|---|---|---|
| `langgraph/booking.graph.ts` (commit sau approval) | `POST /api/v1/appointments/booking` | `Authorization: Bearer <token>`, `booking_mode: "ai_select"`, UUID `ai_booking_operation_id` và conversation id để idempotency/audit |
| `tools/relative_analyzer.tool.ts` | `GET /api/v1/relatives/patient/relatives` | Bearer |
| `tools/specialty_name_analyzer.tool.ts` | `POST /api/v1/specialties` | không có header auth |
| `tools/get_health_profile.tool.ts` | `GET /api/v1/health-profiles/:relativeId` | Bearer |
| `services/chatbot.service.ts` | `POST`/`GET /api/v1/chat-history*` (legacy history/context) | Bearer |

Patient-chat graph chỉ gọi API tạo lịch sau `Command({ resume: { decision: APPROVE } })`; operation UUID duy nhất được persist theo appointment để retry không tạo appointment/notification thứ hai. Tool proposal không tạo appointment hoặc hồ sơ người thân.

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

## Conversational admin report assistant (2026-09)

All routes below are protected by `JwtAuthGuard`, `PermissionsGuard`, and the existing `ai-coach-report:read` permission. Conversation reads are scoped to the authenticated owner.

| Method and route | Contract |
|---|---|
| `POST /admin-reports/assistant/conversations` | `{ message }`; creates a conversation and runs the first assistant turn. |
| `GET /admin-reports/assistant/conversations?page=1&limit=20` | Lists the caller's conversations, newest updated first; `limit` is capped at 50. |
| `GET /admin-reports/assistant/conversations/:id?beforeMessageId=&limit=50` | Loads an owned conversation and an ascending message page; `limit` is capped at 100. |
| `POST /admin-reports/assistant/conversations/:id/messages` | Exactly one of `{ message }` or `{ confirmPlanMessageId }`. A confirmation must name the newest `PROPOSE_PLAN` message. |

Turn responses include the conversation, newly saved user/assistant messages, and an optional saved report. The chatbot endpoint `POST /chatbot/report-assistant` additionally requires the internal service key and a forwarded Bearer access token whose verified subject matches `userId`. Its internal request includes backend-derived `conversationId`, persisted user `turnId`, fixed `threadId`, and `mode: MESSAGE | CONFIRM_PLAN`; a bounded `historySeed` is used only to bootstrap a thread without checkpoint state. The client cannot choose the thread ID. New report plans suspend at a LangGraph `interrupt`; only the backend's validated plan confirmation resumes the same thread with `Command({ resume })`. A regular message while approval is pending resumes it as `REVISE`. Requests remain limited to 12 recent messages/12,000 characters, 30 turns per 5 minutes and 3 confirmed report generations per hour per verified user. The legacy generator and `POST /chatbot/create-report` retain their prior contract.

The graph uses PostgreSQL `PostgresSaver` for short-term per-thread checkpoints and `PostgresStore` for per-admin report-preference memory. Public admin routes remain unchanged. Explicit “remember/show/forget” requests operate on the preference profile and return public action `ANSWER`; ordinary chat does not write memory. `REPORT_ASSISTANT_STATE_UNAVAILABLE` and `REPORT_ASSISTANT_MEMORY_FAILED` are stable 503 codes when native persistence is unavailable.

## Patient multi-thread chat (2026-09)

Patient routes above share the same singleton `PostgresSaver`/`PostgresStore`, but use thread IDs `patient-chat:v1:{userId}:{conversationId}` and store namespace `patient-chat/user/{userId}/preferences`. Backend derives the thread identity and forwards the verified access JWT only as a Bearer header. Transcript and ownership stay in `patient_chat_conversations`/`patient_chat_messages`; history seed is capped at 12 messages/12,000 characters and is only bootstrap input if no checkpoint exists.

Booking tools create proposals only. The graph pauses with native `interrupt()`; only a latest, owner-scoped approval message can resume it. A normal message while that interrupt is pending is a revision, and approval/cancel/revision mismatches return `PATIENT_CHAT_ACTION_STALE` (409). Deleting a conversation removes its checkpoint before soft-delete. Explicit patient preference memory is limited to language, detail level, preferred weekdays and time of day; it never stores health data or chat text. Patient state/store outages fail closed with `PATIENT_CHAT_STATE_UNAVAILABLE` / `PATIENT_CHAT_MEMORY_UNAVAILABLE` (503).
