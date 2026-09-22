# Error handling — AS-IS

## Backend HTTP errors

`HttpExceptionFilter` (`@Catch()` toàn cục) chuẩn hóa mọi lỗi:

- Lỗi không phải `HttpException`: log server-side kèm stack trace, nhưng client luôn nhận `500` + `{code:'INTERNAL_SERVER_ERROR', details:'Internal server error'}` — không rò rỉ thông tin nội bộ trong mọi trường hợp.
- `HttpException` có body dạng mảng + status 400 (từ `ValidationPipe`) → `code:'VALIDATION_FAILED'`, `details` là mảng lỗi từng field.
- `HttpException` có body object khác → `code = obj.code || HttpStatus[status] || 'UNKNOWN_ERROR'`, `details = obj.message || obj.error || 'Bad request'` — đây là cơ chế các exception tùy biến như `{code:'APPOINTMENT_SLOT_UNAVAILABLE', message}` hay `{code:'CHATBOT_CHAT_TIMEOUT', message}` truyền nguyên `code` ra ngoài.
- Shape lỗi cuối cùng, thống nhất mọi trường hợp: `{ statusCode, status, success:false, data:null, error:{code, details} }`.
- `ResponseInterceptor` bỏ qua bọc response nếu `headersSent` đã true (redirect Google OAuth, hoặc 4 action của `AuthController` tự `res.status().json()`).

**Implementation Evidence**

- `backend/src/common/filters/http-exception.filter.ts`
- `backend/src/common/interceptors/response.interceptor.ts`
- `backend/src/main.ts`

## Validation

`ValidationPipe({transform:true, whitelist:true})` toàn cục — **không** có `forbidNonWhitelisted`, nên field lạ bị âm thầm loại bỏ thay vì bị từ chối. Một số DTO dùng raw `@Body('field')` thay vì class có decorator (ví dụ `set-new-password`), nên không có validate class-validator ở tầng đó — validate thật nằm trong service. Entity CHECK constraint (rating 1–5, số đo dương/không âm) là lưới an toàn cuối ở tầng DB.

## Frontend HTTP behavior

- Axios `withCredentials`. 401 → 1 lần thử refresh (dedup qua promise/queue chung), retry request gốc; refresh thất bại → best-effort logout + redirect cứng `/sign-in` **chỉ khi** path hiện tại không thuộc danh sách công khai (khách xem trang public không bị ép văng ra).
- `frontend/` dùng `src/components/notification/{StateCard,ErrorState,NotFoundResult}.tsx`; `admin/` dùng bộ tương đương riêng `src/components/app/{LoadingState,ErrorState,EmptyState}.tsx` — **không hoán đổi giữa 2 app**. Sự tồn tại của component không đồng nghĩa mọi trang đều dùng nó nhất quán: ví dụ patient `Appointments.tsx` dùng khối tĩnh riêng (không phải `ErrorState`) cho lỗi tải chi tiết lịch hẹn, và ô trống (empty state) tùy biến thay vì `NotFoundResult` cho danh sách rỗng.
- `admin/`: sau 1 lần refresh thất bại liên tiếp (`_retryCount>=1`) gọi `handleSessionExpired()` — xóa store, best-effort logout, redirect cứng `/login`, dùng cờ module-level chống redirect trùng lặp.

**Implementation Evidence**

- `frontend/src/configs/axios.ts`, `admin/src/configs/axios.ts`
- `frontend/src/components/notification/`, `admin/src/components/app/{ErrorState,LoadingState,EmptyState}.tsx`

## Rate-limit errors

- Backend: throttler Redis-backed theo bucket (login/refresh/accountChange/otpVerification + mặc định toàn cục 100/phút); header `X-RateLimit-*`/`Retry-After` được expose qua CORS. Tên class `FailOpenThrottlerStorage` gợi ý limiter cho qua request nếu Redis lỗi thay vì chặn toàn bộ API — `[UNCERTAIN]` chưa đọc chi tiết implementation để xác nhận 100%.
- WebSocket: giới hạn riêng cho connection/event/send-message, lỗi trả qua `ws-error` (không phải HTTP status) kèm `retryAfter`; frontend hủy sự kiện đang chờ gửi và toast (dedup theo `toastId`).
- Chatbot: rate-limit theo bucket độc lập với backend (chat/report/health-roadmap/upload), Redis-backed (`RedisRateLimitStore`, atomic `INCR`+`PEXPIRE NX`), **fail-open xác nhận rõ trong code** (`middlewares/rateLimit.ts`: lỗi Redis → log rồi `next()`, không chặn). Trả `429 CHATBOT_RATE_LIMITED` + header `RateLimit-*`. Một request chat bận rộn không tiêu hao quota của bucket report (bucket tách biệt theo tên).

## Background-job failures (BullMQ)

- 3 queue: `email-queue` (welcome/OTP/lịch hẹn, `attempts:3` backoff mũ), `upload-file-queue` (metadata Cloudinary → DB, `attempts:3`), `audit-logs-queue` (`attempts:2`). Tất cả `removeOnFail:false` — job lỗi vẫn nằm trong tập failed để soi thủ công, không tự động dọn.
- Audit log: nếu `user_id` trong job đã bị xóa khỏi DB đúng lúc job chạy, `AuditLogsService.create` throw `NotFoundException` → job fail (được retry tối đa 2 lần rồi bỏ) — log audit đó **có thể bị mất vĩnh viễn**, không có fallback ghi `user:null`.
- Upload: file đã lên Cloudinary bị rollback (xóa) thủ công nếu bước enqueue ghi DB thất bại — không phải transaction phân tán thật, chỉ là bù trừ.
- Không có bằng chứng về cơ chế thông báo cho người dùng khi job nền thất bại vĩnh viễn ngoài việc dữ liệu đơn giản không xuất hiện — `[UNCERTAIN]`.

**Implementation Evidence**

- `backend/src/bullmq/queues/{email,uploadFile,auditLogs}/*.ts`
- `backend/src/common/interceptors/writeAuditLog.interceptor.ts`

## AI/chatbot error taxonomy (cross-cutting trong `chatbot/`)

- Nguồn thống nhất: `utils/retry.ts` — `ChatbotOperationError` (status/code/details/retryable) + `normalizeChatbotError` (phân loại lỗi Axios/backend/Zod validation, đánh dấu retryable theo `{408,429,500,502,503,504}` hoặc lỗi kết nối).
- `withRetry`: backoff ~500ms/1000ms + jitter ±25%, có deadline tổng (`totalTimeoutMs`) không reset theo từng lần thử.
- Mỗi trong 4 LangGraph flow xử lý lỗi theo phong cách khác nhau: diagnosis/create-report/health-roadmap dùng field `error*`/`nextNode*` per-node, dồn vào một node "trả lời lỗi thân thiện" (LLM cho diagnosis/report; **xác định trước, không LLM**, cho health-roadmap dù tên node gợi ý LLM); booking bọc lỗi tool bằng `runToolSafe` (không throw ra ngoài graph) và chỉ node đặt lịch cuối mới try/catch thật.
- Biên HTTP cuối cùng (`middlewares/errorHandler.ts`): lỗi Multer (`LIMIT_*`) map riêng sang 413/400; mọi lỗi khác qua `normalizeChatbotError` (idempotent); với `status>=500`, message luôn bị thay bằng chuỗi cố định "Chatbot service could not process the request." — xác nhận bởi test tích hợp (một lỗi giả lập "database password leaked" không bao giờ lộ ra response thật).
- `/chatbot/create-report` không xác thực theo user (không gửi `token`) — chỉ được bảo vệ bởi kiểm tra internal-service-key; ai sở hữu key này (thường chỉ backend) đều gọi được, rate-limit theo IP không theo user.

**Implementation Evidence**

- `chatbot/src/utils/retry.ts`, `chatbot/src/middlewares/errorHandler.ts`
- `chatbot/src/langgraph/*.graph.ts`
- `chatbot/test/integration/chatbot.route.integration.spec.ts`

## Conversational report assistant errors (2026-09)

The backend assistant API returns stable codes for invalid input, missing conversation/plan, stale plan, chatbot quota, malformed chatbot response, timeout, persistence failure, and generic assistant failure: `REPORT_ASSISTANT_INVALID_INPUT`, `REPORT_CONVERSATION_NOT_FOUND`, `REPORT_PLAN_NOT_FOUND`, `REPORT_PLAN_STALE`, `CHATBOT_RATE_LIMITED`, `REPORT_ASSISTANT_INVALID_RESPONSE`, `REPORT_ASSISTANT_TIMEOUT`, `REPORT_ASSISTANT_PERSISTENCE_FAILED`, and `REPORT_ASSISTANT_FAILED`. Chatbot 5xx responses remain redacted by its existing HTTP error handler. User messages are persisted before the upstream call; report plus assistant-message persistence uses a short transaction after PDF generation, and a newly uploaded asset is deleted if that transaction fails. Numeric-grounding failures stop before PDF creation and return a failure state through the existing pipeline.

Native LangGraph persistence adds `REPORT_ASSISTANT_STATE_UNAVAILABLE` (503) when the Postgres checkpointer/Store cannot initialize or restore required state, and `REPORT_ASSISTANT_MEMORY_FAILED` (503) for explicit preference-memory operations that fail validation or persistence. The feature fails closed: it never falls back to a stateless graph. Missing/mismatched pending interrupts, duplicate confirmations, and confirmations after a graph restart without a valid checkpoint return `REPORT_PLAN_STALE` (409); no second PDF is generated. A normal user message that arrives while the approval interrupt is pending resumes it as a revision and invalidates that plan.

## Patient chat and booking errors (2026-09)

Patient multi-thread endpoints use stable codes including `PATIENT_CHAT_INVALID_INPUT` (400), `PATIENT_CHAT_APPROVAL_NOT_FOUND` (404), `PATIENT_CHAT_ACTION_STALE` (409), `PATIENT_CHAT_TIMEOUT` (504), and `PATIENT_CHAT_INVALID_RESPONSE` (502). `PATIENT_CHAT_STATE_UNAVAILABLE` and `PATIENT_CHAT_MEMORY_UNAVAILABLE` are 503 errors when the shared LangGraph checkpoint/Store cannot be safely used; requests do not fall back to a stateless graph. Upstream user messages are already persisted before chatbot execution, so a failed turn can be retried without losing the request.

Booking resume requires a pending interrupt, matching operation UUID, matching stored summary and latest owner-scoped approval. Duplicate/mismatched confirmations return `PATIENT_CHAT_ACTION_STALE` (409) and do not create another appointment. Appointment idempotency by `ai_booking_operation_id` prevents a network retry from creating duplicate rows or notifications. A normal message while approval is pending resumes as `REVISE`; `CANCEL` finalizes without calling the appointment API. Chat deletion is checkpoint-first, so a checkpoint deletion error leaves the application conversation undeleted and retryable. Explicit preference-memory storage/read/delete failures return `PATIENT_CHAT_MEMORY_UNAVAILABLE` rather than silently ignoring the request.

## Kết luận từ vòng xác minh: không tự động suy ra "an toàn y tế" từ code

Code có nhiều lớp phòng vệ kỹ thuật (validate schema, XOR upload, rate-limit, không rò rỉ lỗi nội bộ, dò red-flag khẩn cấp bằng regex độc lập với LLM), nhưng đây là bằng chứng về **cách hệ thống xử lý lỗi kỹ thuật**, không phải bằng chứng về tính an toàn/đúng đắn y khoa của nội dung do AI sinh ra — output AI phải được coi là không mang tính chẩn đoán trừ khi có chính sách sản phẩm khác nói rõ.
