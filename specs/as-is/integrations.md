# Integrations and infrastructure — AS-IS

## PostgreSQL and TypeORM

Backend dùng PostgreSQL qua TypeORM (`migrationsRun:true`, `synchronize:false`). Chatbot kết nối cùng DB bằng role riêng `chatbot_readonly` (session-level `default_transaction_read_only=on`, `statement_timeout=15s`), giới hạn ở các view chỉ đọc, tách thành 2 datasource riêng: một cho SQL-QA hướng bệnh nhân (3 view), một cho báo cáo admin (7 view `chatbot_report_*`).

## Redis

Một instance Redis dùng cho 2 mục đích tách biệt logic (khác DB index):

- **Cache** (`backend/src/redis-cache/`, DB mặc định/0): session version, refresh-token session list, blacklist token, permission resolved theo user (TTL 3600s), cache danh sách/chi tiết bác sĩ/lịch/lịch hẹn/bài viết/chuyên khoa/hồ sơ sức khỏe/coach-profile (đa số TTL 3600s), cache system settings (TTL 60s), cache danh sách admin active (TTL 30s dùng cho fan-out thông báo).
- **BullMQ** (`bullmq.module.ts`, DB index 1 — cấu hình riêng, tách biệt hoàn toàn khỏi cache ở trên dù cùng Redis instance).
- **Chatbot rate-limit** (`chatbot/src/configs/redis.ts`, DB index riêng theo `REDIS_DB` env, mặc định 2 theo `.env.example`) — dùng chung Redis server với backend (đúng theo `docker-compose.dev.yml`) nhưng DB index khác để tránh đụng độ key.

Docker cung cấp thêm RedisInsight để kiểm tra thủ công lúc dev.

## BullMQ and email

3 queue: `email-queue` (chào mừng/OTP/thông báo lịch hẹn — SMTP qua `MAIL_USER`/`MAIL_PASS`, template Handlebars cho welcome/OTP, email lịch hẹn dựng HTML/text inline), `upload-file-queue` (ghi metadata Cloudinary vào DB sau khi upload xong — buffer file thô **không** đi qua Redis, chỉ metadata), `audit-logs-queue` (ghi bản ghi audit log, nguồn duy nhất là `WriteAuditLogInterceptor`). Mỗi queue có cấu hình retry/backoff riêng (xem `error-handling.md`).

## Cloudinary

Dùng cho: avatar user, file đính kèm tin nhắn, ảnh bài viết, ảnh chuyên khoa (upload đồng bộ trước khi lưu record), và — ở service `chatbot/` — lưu trữ PDF báo cáo/lộ trình sức khỏe do AI sinh (`resource_type:'raw'`, folder `pdfs`) rồi trả về URL cho client, không stream file nhị phân qua response API.

## Google OAuth

Cấu hình client ID/secret/callback (`GOOGLE_CALL_BACK`) + strategy Passport. Đăng nhập Google **luôn** đi qua cùng logic `login()` của patient — nghĩa là tài khoản tạo/đăng nhập qua Google luôn được gán role PATIENT, không có đường Google-login cho staff. Redirect thành công tới `FRONTEND_URL` (mặc định fallback `http://localhost:5173` nếu env thiếu). Lưu ý vận hành từ README: Docker backend cố định `GOOGLE_CALL_BACK` về `http://localhost:3010/...` — cần đăng ký đúng URI này trong Google Cloud Console nếu muốn Google login hoạt động khi chạy qua Docker.

## Socket.IO

Gateway backend dùng chung danh sách CORS allow-list với HTTP app. Xác thực bằng cookie `accessToken`, xác minh lại **mỗi event** (không chỉ lúc connect) qua `WsCookieAuthGuard` — cùng cơ chế `session_version`/blacklist với HTTP. Phòng theo `user:<id>` (thông báo/lịch hẹn cá nhân) và `room:<channelId>` (tin nhắn theo kênh, yêu cầu là thành viên). Rate-limit WebSocket độc lập với rate-limit HTTP.

## AI providers and retrieval — `[CONFLICT]` đã xác minh, sửa lại tuyên bố cũ

- **Xác nhận bằng code**: `chatbot/src/configs/llm.ts`/`embeddings.ts` chỉ implement `ChatOpenAI`/`OpenAIEmbeddings` (`@langchain/openai`), đọc từ `OPENAI_MODEL`/`OPENAI_FAST_MODEL`/`OPENAI_VISION_MODEL`/`OPENAI_EMBEDDING_MODEL` (khóa cứng phải bằng `text-embedding-3-small`/1536 chiều, throw nếu lệch). `baseURL` có thể trỏ qua một proxy LLM nội bộ (nhiều comment code ghi nhận proxy này không đáng tin cậy với `response_format: json_schema`, buộc nhiều tool dùng `method:"functionCalling"` thay thế).
- **Không xác nhận được**: README liệt kê nhà cung cấp là "Gemini/OpenAI/Ollama" — không tìm thấy cấu hình/kết nối Gemini hay Ollama nào trong `chatbot/src/`. Chuỗi "Gemini" chỉ xuất hiện trong **một** mô tả tool tĩnh (`tools/ocr.tool.ts:275`, văn bản mô tả gửi cho LLM, không phải code gọi Gemini thật) trong khi chính tool đó dùng `getVisionModel()` (OpenAI). Kết luận: `[DOCUMENTATION ONLY]` cho phần "Gemini/Ollama" của README — chưa xác minh được bằng runtime code, không nên coi là tích hợp đang hoạt động.
- Qdrant: tên collection khóa cứng (`BOOKING_DOCTOR_SYSTEM_OPENAI_TE3_SMALL_V1`), throw nếu env `QDRANT_COLLECTION_NAME` không khớp chính xác. Production boot chỉ attach vào collection có sẵn (không rebuild); môi trường khác tự build/reconcile lại từ 2 file PDF nguồn (`service.pdf`, `rules.pdf`) mỗi lần khởi động.
- `langchain/hub`: pull prompt template qua mạng lúc load module (RAG + SQL-QA hướng bệnh nhân) — phụ thuộc mạng ngoài lúc khởi động, có bọc `withRetry`.

## Province lookup

Frontend patient dùng `VITE_PROVINCES_API_URL` (provinces.open-api.vn) — dịch vụ tra cứu tỉnh/huyện/xã bên thứ ba, không thuộc quyền kiểm soát của repo này; nơi gọi cụ thể (`fetchProvinces()`) chưa xác định được component tiêu thụ trong lượt nghiên cứu này — `[UNCERTAIN]`.

## Docker local topology

`docker-compose.dev.yml`: PostgreSQL 17, Redis (yêu cầu password, AOF bật), backend, admin, frontend, chatbot, pgAdmin, RedisInsight. Container dev dùng lệnh `start:dev`/`dev`/`preview` tương ứng — không phải bằng chứng cấu hình production. Cổng host khác cổng native để 2 kiểu chạy song song không đụng nhau (xem README/`product-overview.md`).

**Implementation Evidence**

- `backend/src/app.module.ts`, `backend/src/database/database.module.ts`
- `backend/src/redis-cache/redis-cache.service.ts`, `backend/src/bullmq/bullmq.module.ts`
- `backend/src/mail/`, `backend/src/uploads/`, `backend/src/websockets/websocket.gateway.ts`
- `chatbot/src/configs/{llm,embeddings,vectordb,redis,cloudinary}.ts`
- `chatbot/src/tools/ocr.tool.ts` (mô tả tool nhắc "Gemini" — không khớp implementation)
- `.env.example` của cả 4 service, `docker-compose.dev.yml`
