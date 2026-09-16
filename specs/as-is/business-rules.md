# Business rules — AS-IS

## Authentication and sessions

- Local login tra theo username hoặc email, so khớp bcrypt; user không có password (tài khoản Google-only) nhận thông báo hướng dẫn dùng Google/quên-mật-khẩu thay vì lỗi sai-mật-khẩu chung.
- Patient login (`/auth/login`) yêu cầu role `PATIENT`; admin login (`/auth/admin/login`) từ chối tài khoản **chỉ** có role PATIENT (tài khoản có thêm ADMIN/DOCTOR vẫn dùng được).
- JWT payload chỉ gồm `{userId, roles}` khi verify qua `JwtStrategy` (không có `doctorId`/`doctor` — xem hệ quả ở dashboard doctor, mục `known-ambiguities.md`). Access token đọc từ cookie hoặc Bearer header; refresh chỉ đọc từ cookie.
- Redis lưu `session_version:<userId>` (không TTL), `refresh_tokens:<userId>` (list, không TTL riêng), `blacklist:<tokenId>` (TTL = thời gian còn lại của token).
- `MAX_DEVICES=3` nhưng điều kiện loại bỏ session cũ là `sessions.length > 3` **trước khi** thêm mới — thực tế cho phép tới 4 phiên đồng thời trước khi phiên cũ nhất bị blacklist. `[CONFLICT]`, không tự sửa.
- Refresh token **rotate mỗi lần dùng** (single-use): tokenId cũ bị blacklist, tokenId mới cấp và lưu lại.
- Đặt lại mật khẩu quên dùng OTP (5 phút, tối đa 5 lần thử sai) → `resetToken` một lần dùng (10 phút) → `/auth/set-new-password`. Tiêu thụ token atomically (`UPDATE ... WHERE consumed_at IS NULL`, kiểm tra `affected`) chống double-use đồng thời. Cả gửi và xác minh OTP luôn trả thông báo generic bất kể lý do thất bại thật (chống dò tài khoản).
- Đổi mật khẩu (tự đổi hoặc qua reset) đều tăng `session_version` + xóa toàn bộ `refresh_tokens` — đăng xuất mọi thiết bị khác ngay lập tức.
- Google OAuth: user hiện có chưa có role nào → tự gán PATIENT (lỗi nếu role PATIENT không tồn tại trong DB); email mới hoàn toàn → tạo user bằng cùng hàm dùng cho đăng ký local, khử trùng username bằng hậu tố 4 số cuối của timestamp.
- Admin khóa (`is_locking=true`) hoặc vô hiệu hóa (`is_active=false`) một tài khoản: chặn đăng nhập mới (mật khẩu lẫn Google, `ForbiddenException`) VÀ tăng `session_version` + xóa `refresh_tokens` ngay lập tức — đá phiên đang mở của tài khoản đó ra khỏi hệ thống, giống hệt cơ chế đổi mật khẩu. Mở khóa/kích hoạt lại không cần revoke gì (không có phiên đang chặn cần dọn).

**Implementation Evidence**

- `backend/src/modules/auth/auth.service.ts`, `session-auth.service.ts`, `jwt.strategy.ts`, `refresh.strategy.ts`, `google.strategy.ts`
- `backend/src/utils/constants.ts` (roles, `MAX_DEVICES`), `backend/src/utils/cookieOptions.ts`
- `backend/src/modules/users/users.service.ts` (`setLocking`, `setActive`, `revokeAllSessions` — khóa/vô hiệu hóa tài khoản)

## Authorization

- `PermissionsGuard` yêu cầu **tất cả** permission trong `@Permissions(...)` (AND, không OR); handler có `@UseGuards(PermissionsGuard)` nhưng không `@Permissions(...)` thì guard cho qua không kiểm tra gì.
- Permission được resolve theo role name (không phải theo user id trực tiếp) và cache Redis 1 giờ theo `permissions:<userId>`.
- Sửa permission của một **role** buộc mọi user giữ role đó đăng nhập lại ngay (tăng `session_version` + xóa refresh token); sửa role của một **user cụ thể** thì chỉ xóa cache permission, **không** buộc đăng nhập lại — access token cũ vẫn giữ claim role cũ tới khi tự hết hạn. `[CONFLICT]` giữa 2 cơ chế tương tự.
- ADMIN, kể từ migration `1787100000000-seedAdminFullPermissions.ts`, luôn nắm giữ **100%** permission tồn tại trong hệ thống (không phải danh sách tĩnh từ seed đầu) — mọi migration thêm permission mới sau đó đều tự cấp lại cho ADMIN tường minh.
- Admin UI kiểm tra permission tương tự (cùng danh mục chuỗi) nhưng chỉ là lớp trải nghiệm; backend `PermissionsGuard` là nguồn xác thực cuối cùng.

**Implementation Evidence**

- `backend/src/common/guards/permissions.guard.ts`
- `backend/src/modules/role-permission/role-permission.service.ts`, `roles.service.ts`
- `backend/src/database/migrations/1787100000000-seedAdminFullPermissions.ts`
- `admin/src/hooks/usePermission.ts`, `admin/src/config/permissions.ts`

## Appointments and schedules

- **Đặt lịch** (giao dịch DB đầy đủ): từ chối ngày trong quá khứ; xác định bệnh nhân (relative đã có, khóa pessimistic-write; hoặc tạo relative mới, khử trùng theo fullname+relationship+phone dưới cùng khóa để chống double-book đồng thời); xác định ca khám — chọn thủ công (`doctor_schedule_id`, phải khớp `day_of_week` với ngày yêu cầu) HOẶC tự động chọn (`specialty_id`+`start_time`, chọn ca sớm nhất còn trống chưa có lịch PENDING/CONFIRMED cùng ngày, khóa pessimistic-write); kiểm tra chéo bệnh nhân không có lịch PENDING/CONFIRMED khác trùng khung giờ cùng ngày (bất kể bác sĩ nào); cuối cùng dựa vào unique index DB làm lưới an toàn cuối. Vi phạm unique index (`23505` trên `unique_doctor_schedule_date`) được bắt và chuyển thành thông báo thân thiện "Ca này đã có lịch hẹn!" + emit socket `appointment:fail`.
- **Hủy lịch**: chỉ khi lịch còn `PENDING` và thuộc về người gọi; thông báo lỗi cố tình gộp "không tìm thấy" và "không thể hủy" để tránh lộ thông tin tồn tại.
- **Chuyển trạng thái** (whitelist tường minh, đã xác nhận — không còn UNCERTAIN): `PENDING → {CONFIRMED, CANCELLED}`; `CONFIRMED → {COMPLETED, CANCELLED, ABSENT}`; `COMPLETED`/`CANCELLED`/`ABSENT`/`EXPIRED` là trạng thái cuối, không chuyển tiếp được. Chỉ ADMIN hoặc bác sĩ sở hữu lịch hẹn mới đổi được trạng thái. `EXPIRED` chỉ hệ thống (cron) được gán, API từ chối nếu client cố set thủ công. Đánh dấu `COMPLETED`/`ABSENT` yêu cầu giờ bắt đầu ca khám đã trôi qua.
- **Tự động hết hạn**: cron mỗi phút chuyển các lịch `PENDING` đã quá giờ kết thúc ca sang `EXPIRED` (điều kiện `WHERE status='PENDING'` trong UPDATE để tránh đua với thay đổi trạng thái thủ công đồng thời).
- **Nhắc lịch**: cron mỗi phút, gửi thông báo (và email nếu cả 2 cấp cài đặt hệ thống + cá nhân đều bật) cho lịch `CONFIRMED` sắp tới trong cửa sổ cấu hình (mặc định 1440 phút = 24h); chống trùng bằng `dedupe_key` unique — insert trùng bị bắt và bỏ qua âm thầm (không lỗi).
- Ca khám (`doctor_schedules`) unique theo `(doctor, day_of_week, start_time, end_time)`; service còn kiểm tra chồng chéo khoảng thời gian (không chỉ trùng khít) trong cùng ngày cho cùng bác sĩ. **Xóa ca khám là hard-delete** (không soft-delete như hầu hết entity khác) — nếu còn appointment tham chiếu FK, xóa sẽ thất bại ở tầng DB (không có `ON DELETE CASCADE`).
- Kết quả khám (`ExaminationResult`) chỉ tạo được khi lịch hẹn `COMPLETED` và do đúng bác sĩ phụ trách tạo; 1-1 với appointment (từ chối nếu đã có kết quả). Sửa/xóa kết quả khám cũng yêu cầu đúng bác sĩ sở hữu.
- Đánh giá hài lòng (`SatisfactionRating`) chỉ tạo được khi lịch hẹn `COMPLETED` VÀ đã có kết quả khám VÀ do chính người đặt lịch tạo; 1-1 với appointment, điểm 1–5. Đọc/sửa: chủ sở hữu HOẶC người có `satisfaction-rating:manage`. **Không có chức năng xóa** (`delete()` là stub rỗng, không route nào gọi).

**Implementation Evidence**

- `backend/src/modules/appointments/appointments.controller.ts`, `appointments.service.ts`
- `backend/src/entities/appointment.entity.ts`, `doctorSchedule.entity.ts`
- `backend/src/database/migrations/1786530000000-addAppointmentExpiredStatus.ts`, `1786600000000-addUniqueDoctorScheduleDateIndex.ts`
- `backend/src/modules/examination-result/examination-result.service.ts`, `backend/src/modules/satisfaction-rating/satisfaction-rating.service.ts`

## Health and clinical data

- Health profile 1-1 với relative, luôn được tạo rỗng ngay khi relative được tạo (kể cả self-profile lúc đăng ký) — endpoint `create()` riêng gần như không chạm tới được qua flow bình thường.
- Các trường đo lường có CHECK dương/không âm ở tầng DB (weight/height/heart_rate > 0; glucose/cholesterol ≥ 0).
- Relative: `phone` **unique toàn cục** across mọi user (không chỉ theo owner) — hai user khác nhau không thể đăng ký người thân trùng số điện thoại.

**Implementation Evidence**

- `backend/src/entities/healthProfile.entity.ts`, `relative.entity.ts`
- `backend/src/modules/relatives/relatives.service.ts`

## Content

- Slug bài viết sinh từ `title + Date.now()` nên gần như luôn unique dù title trùng. Bài viết chỉ **sửa/xóa được khi đã được duyệt** (`is_approve=true`) — bài chờ duyệt gần như bất biến ngoại trừ chính hành động duyệt.
- Route public liệt kê bài viết (`POST /articles`, không guard) mặc định chỉ trả bài đã duyệt, nhưng chấp nhận filter `is_approve=false` từ bất kỳ ai — `[CONFLICT]` khả năng lộ bài chưa duyệt cho khách ẩn danh.
- Chuyên khoa/topic/tag: tên+slug unique (so khớp không phân biệt hoa-thường ở service layer).
- Upload file bài viết/tin nhắn: ownership check (tác giả hoặc `article:manage`; người gửi tin nhắn) thực hiện **trước** khi gọi Cloudinary, không phải sau — nếu enqueue ghi DB thất bại, file đã upload Cloudinary bị rollback (xóa) theo cơ chế bù trừ thủ công, không phải transaction phân tán thật.

## Messaging and notifications

- Thành viên kênh unique theo `(channel, user)`. Tạo kênh mới sẽ tái sử dụng kênh đã tồn tại nếu trùng khớp chính xác tập thành viên (không tạo trùng).
- **Nội dung tin nhắn được mã hóa tại nghỉ** (encrypt trước khi lưu DB, decrypt khi đọc) — không lưu plaintext trong Postgres.
- Gửi tin nhắn qua WebSocket yêu cầu là thành viên kênh; qua HTTP cũng vậy.
- Thông báo: inbox cá nhân, đếm chưa đọc, đánh dấu đã đọc/đã đọc tất cả; sự kiện lịch hẹn (tạo/hủy/đổi trạng thái/hết hạn) fan-out tới cả bệnh nhân, bác sĩ phụ trách, và mọi ADMIN đang active (cache 30s) — mỗi vai trò nhận nội dung/actionUrl khác nhau. Trùng lặp (theo `dedupe_key`) thất bại âm thầm, không lỗi.

## Limits and validation

- Rate limit toàn cục 100/phút (mặc định throttler); các bucket riêng: login 5/phút, refresh 10/phút, đổi tài khoản (đăng ký/quên mật khẩu/đặt lại) 3/10 phút, xác minh OTP 5/5 phút — tất cả có `blockDuration` 5 phút sau khi vượt ngưỡng.
- WebSocket: connection 20/phút, event mặc định 60/phút, `send:message` 30/phút riêng.
- Chatbot: `chat` 120/phút, `report`/`health-roadmap` đều 12/phút — theo user (nếu có token hợp lệ) hoặc theo IP (nếu không, ví dụ `create-report`).
- `ValidationPipe` transform + whitelist (loại field lạ âm thầm, không từ chối); lỗi validation → `code: VALIDATION_FAILED`.

**Implementation Evidence**

- `backend/src/common/rate-limit/`
- `backend/src/websockets/`
- `chatbot/src/routes/chatbot.route.ts`, `chatbot/src/middlewares/rateLimit.ts`
- `backend/src/main.ts`
