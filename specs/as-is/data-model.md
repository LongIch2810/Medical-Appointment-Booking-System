# Data model — AS-IS

## Persistence

PostgreSQL là database chính. TypeORM entity ánh xạ model nghiệp vụ; migration chạy tự động lúc khởi động (`migrationsRun:true`), `synchronize:false`. Chatbot có DB role/view chỉ đọc riêng (`chatbot_readonly`) cho reporting/SQL-QA tool.

**Implementation Evidence**

- `backend/src/database/database.module.ts`
- `backend/src/entities/`
- `backend/src/database/migrations/`
- `backend/src/database/migrations/1779638801391-createViews.ts`, `1779638820330-grantChatbotReadonly.ts`, `1787300000000-secureChatbotReporting.ts`

## Entity inventory (đầy đủ cột đã xác nhận qua entity class)

| Entity (bảng) | Cột chính | Quan hệ / ràng buộc |
|---|---|---|
| `users` (`User`) | `username`/`email` unique not-null, `phone` unique nullable, `password` nullable (null = tài khoản Google-only), `fullname`, `gender` bool default true, `date_of_birth`, `picture`, `address`, `isAdmin` bool default false (`[UNCERTAIN]`/khả năng dead — không thấy guard/service nào đọc cờ này ngoài RBAC roles), `is_active` default true (từ migration `1788200000000-fixUserIsActiveDefault`; trước đó default false), `is_locking` default false | 1:1 `Doctor`, `UserSetting`; 1:N `UserRole`, `Notification`, `Article` (author), `Conversation`, `Otp`, `Message` (sender), `ChannelMembers`, `Relative`, `Appointment` (booker), `AuditLog`, `Complaint`. Soft delete. `is_active`=false (admin vô hiệu hóa) hoặc `is_locking`=true (admin khóa) đều chặn login (`AuthService.validateUser`, `GoogleStrategy.validate`) và bị revoke session (`session_version`+`refresh_tokens`) ngay khi admin đổi trạng thái — xem `known-ambiguities.md`. |
| `roles` (`Role`) | `role_name` unique, `role_code` unique int, `description` | 1:N `UserRole`, `RolePermission`. Seed: `seedData`. |
| `permissions` (`Permission`) | `name` unique | 1:N `RolePermission`. Seed/mở rộng qua nhiều migration (xem `permissions.md`). |
| `role_permissions` (`RolePermission`) | `Unique(role,permission)`, **soft-deletable** (xóa mềm = "thu hồi"; `restore()` = "cấp lại" thay vì insert trùng) | FK `role`, `permission`. |
| `user_roles` (`UserRole`) | `Unique(user,role)` | FK `user`(CASCADE), `role`(CASCADE). Soft delete. |
| `doctors` (`Doctor`) | `experience` int, `about_me`, `workplace`, `doctor_level` enum (DK/CKI/CKII/THS/TS/PGS/GS, default DK) | 1:1 `User`; N:1 `Specialty`; 1:N `DoctorSchedule`. Soft delete. |
| `doctor_schedules` (`DoctorSchedule`) | `day_of_week` enum not-null, `start_time`/`end_time` time not-null, `is_active` default true | N:1 `Doctor` not-null; 1:N `Appointment`. `Unique(doctor, day_of_week, start_time, end_time)`. **Không có soft delete** (xóa là hard delete — điểm khác biệt so với hầu hết entity còn lại). |
| `appointments` (`Appointment`) | `appointment_date` date not-null, `status` enum (PENDING/CONFIRMED/COMPLETED/CANCELLED/ABSENT/EXPIRED, default PENDING), `booking_mode` enum (user_select/ai_select, default user_select) | N:1 `DoctorSchedule` not-null, N:1 `Relative` (patient) not-null, N:1 `User` (booked_by_user) not-null; 1:1 `ExaminationResult`/`SatisfactionRating` nullable. **Unique index partial** `unique_doctor_schedule_date` trên `(doctor_schedule_id, appointment_date)` WHERE `status IN (PENDING,CONFIRMED) AND deleted_at IS NULL`. Enum `EXPIRED` thêm sau bằng `ALTER TYPE`. Soft delete. |
| `examination_result` (`ExaminationResult`) | `symptoms`/`diagnosis`/`treatment`/`prescription` text not-null | 1:1 `Appointment` not-null, `onDelete: CASCADE`. Soft delete. |
| `satisfaction_rating` (`SatisfactionRating`) | `rating_score` int (CHECK 1–5), `feedback` text not-null | 1:1 `Appointment` not-null, `onDelete: CASCADE`. Soft delete. |
| `specialties` (`Specialty`) | `name`/`slug` unique, `description` not-null, `img_url` not-null | 1:N `Doctor`. Seed 15 dòng. Soft delete. |
| `relatives` (`Relative`) | `fullname` nullable (dù DTO tạo mới yêu cầu bắt buộc — cột entity vẫn cho null), `phone` **unique toàn cục** (không chỉ riêng theo owner — `[UNCERTAIN]`/đáng chú ý: 2 user khác nhau không thể có relative cùng số điện thoại), `dob`, `gender` default true | N:1 `User` (owner) not-null; N:1 `Relationship` (join theo `relationship_code`, không phải PK số); 1:1 `HealthProfile`; 1:N `Appointment`. Soft delete. |
| `relationships` (`Relationship`) | `relationship_code`/`relationship_name` unique | 1:N `Relative`. Seed 9 dòng (`ban_than`=self, `cha`, `me`, `vo_chong`, `con_trai`, `con_gai`, `ong`, `ba`, `nguoi_than_khac`). Soft delete. Dòng `ban_than` là phụ thuộc ngầm của luồng tạo user (self-profile) — không có guard nào ngăn xóa dòng seed đang được dùng. |
| `health_profile` (`HealthProfile`) | `weight`/`height`/`heart_rate` int nullable (CHECK `>0`), `blood_type`/`medical_history`/`allergies`/`blood_pressure`/`medications`/`vaccinations`/`exercise_frequency` text nullable, `glucose_level`/`cholesterol_level` int nullable (CHECK `>=0`), `smoking`/`alcohol_consumption` bool nullable, `last_checkup_date` date nullable | 1:1 `Relative` not-null, `onDelete: CASCADE`. Soft delete. Mọi relative được tạo kèm sẵn 1 health-profile rỗng — endpoint `create()` trực tiếp gần như không thể chạm tới qua flow bình thường. |
| `coach_profile` (`CoachProfile`) | `display_name`/`health_goal` not-null, `preferences` simple-array nullable, `age`/`height`/`weight` int nullable (CHECK `>0`) | 1:1 `User` unique, `onDelete: CASCADE`. Soft delete. Hồ sơ AI-coach cho tính năng health-roadmap. |
| `articles` (`Article`) | `title`/`content`/`summary` not-null, `img_urls` jsonb nullable, `slug` unique (sinh từ `title + Date.now()`), `is_approve` default false | N:1 `Topic` not-null, N:1 `User` (author) not-null; 1:N `ArticleTag`. Soft delete. |
| `article_tags` (`ArticleTag`) | `Unique(article, tag)` | join `Article`↔`Tag`. Soft delete. |
| `tags` (`Tag`) | `name`/`slug` unique | 1:N `ArticleTag`. Soft delete. |
| `topics` (`Topic`) | `name` unique, `description` not-null, `slug` unique | 1:N `Article`. Seed ~20 dòng. Soft delete. |
| `channels` (`Channel`) | — | 1:N `Message`, `ChannelMembers`. Soft delete. |
| `channel_members` (`ChannelMembers`) | `Unique(channel, user)` | FK `Channel` not-null, `User`. Không soft delete/timestamp. |
| `messages` (`Message`) | `message_type` enum (regular/call), `content` nullable (**mã hóa tại nghỉ** — xem `error-handling.md`/`integrations.md`), `is_read` default false | N:1 `User` (sender) not-null, N:1 `Channel`; 1:N `MessageAttachments`. Soft delete. |
| `messages_attachments` (`MessageAttachments`) | `url`, `type` enum (VIDEO/IMAGE/DOCUMENT/OTHER, default IMAGE), `file_name`/`file_size`/`file_extension` not-null, `public_id` unique | N:1 `Message`. Không soft delete/timestamp. |
| `notifications` (`Notification`) | `content`/`title` not-null, `is_read` default false (đổi tên từ `is_notified`), `type` varchar default `MANUAL` (enum thêm: APPOINTMENT_CREATED/CANCELLED/STATUS_UPDATED/EXPIRED/REMINDER), `action_url` nullable, `metadata` jsonb default `{}`, `dedupe_key` unique-nếu-not-null | N:1 `User` not-null. Composite index `(user_id, is_read, created_at) WHERE deleted_at IS NULL`. Soft delete. |
| `complaints` (`Complaint`) | `title`/`description` not-null, `complaint_status` enum (pending/in_progress/resolved/rejected, **không có DB default** dù service luôn set PENDING khi tạo), `response` nullable | N:1 `User` nullable. Soft delete. |
| `conversation` (`Conversation`) | `role` enum (human/ai, default human), `content` not-null | N:1 `User`. Soft delete. Đây là transcript chat AI do **backend** lưu (khác với bất kỳ lưu trữ nội bộ nào của service `chatbot/`). |
| `otps` (`Otp`) | `otp_hash` (đã hash, không plaintext), `purpose` default `PASSWORD_RESET`, `attempts` default 0, `expiresAt`, `consumedAt` nullable | N:1 `User`. Không soft delete; bị hard-delete định kỳ bởi cron 10 phút/lần. |
| `reset_tokens` (`ResetToken`) | `token_hash`, `purpose`, `expiresAt`, `consumedAt` nullable | N:1 `User` cascade. Không soft delete. |
| `system_configs` (`SystemConfig`) | `reminder_appointment_before_minutes` int default 1440 (từng là 60), 5 cờ bool default true (`appointment_reminders_enabled`, `appointment_emails_enabled`, `default_realtime_toasts_enabled`, `default_email_notifications_enabled`, `default_appointment_reminders_enabled`), `reminder_update_health_profile_after_minutes` int default 60 (`[UNCERTAIN]`/có thể chưa được đọc bởi service nào — dấu hiệu tính năng chưa triển khai) | Singleton (đảm bảo bằng logic service, không phải DB constraint). Không soft delete. |
| `user_settings` (`UserSetting`) | `email_notifications_enabled`/`appointment_reminders_enabled`/`realtime_toasts_enabled` bool default true, `theme` varchar default `SYSTEM` (CHECK SYSTEM/LIGHT/DARK) | 1:1 `User`, `onDelete: CASCADE`. Tạo lười (lazy) lần đầu user chạm settings, snapshot theo `default_*` của `SystemConfig` **tại thời điểm đó** (không cập nhật động sau này nếu default hệ thống đổi). |
| `audit_log` (`AuditLog`, class `AuditLog`) | `action`, `entity_name`, `old_data`/`new_data` jsonb nullable, `endpoint`, `method`, `status_code`, `is_success` default false, `error_message` nullable, `ip_address`/`user_agent` nullable, `duration_ms` | N:1 `User` nullable, `onDelete: SET NULL` (audit trail giữ lại kể cả khi user bị xóa). **Không** soft delete. |

## Ràng buộc đã xác nhận (đầy đủ)

- `users`: username/email/phone unique.
- `roles`: `role_name`/`role_code` unique. `permissions`: `name` unique.
- `doctor_schedules`: unique `(doctor, day_of_week, start_time, end_time)`; DTO chỉ validate không rỗng cho `day_of_week` (không `@IsEnum`) — enum DB vẫn chặn giá trị sai ở tầng insert.
- `appointments`: unique index có điều kiện theo `(doctor_schedule_id, appointment_date)` chỉ áp dụng khi status còn hiệu lực (PENDING/CONFIRMED) và chưa xóa mềm.
- `relatives`: `phone` unique **toàn cục** (không theo từng owner).
- `specialties`/`topics`/`tags`/`articles`: `name`/`slug` unique (kiểm tra không phân biệt hoa-thường ở tầng service bằng `ILike`/`LOWER`).
- `channel_members`: unique `(channel, user)`.
- `messages_attachments.public_id`: unique.
- `satisfaction_rating.rating_score`: CHECK 1–5.
- `health_profile`: các trường đo lường có CHECK dương/không âm.
- `notifications.dedupe_key`: unique-nếu-not-null — nền tảng cho việc chống trùng lặp thông báo nhắc lịch hẹn (insert trùng bị bắt và bỏ qua âm thầm, không throw).

## Lịch sử migration (các mốc đáng chú ý, không liệt kê toàn bộ)

Base schema: `1779637936560-createTables.ts`. Sau đó theo trình tự thời gian đáng chú ý:
- `1779638786395-seedData.ts`: seed 3 role, 130 permission (ID cố định 1–130), 15 chuyên khoa, 1 admin, 5 patient demo, 9 relationship, 30 doctor demo kèm lịch cố định, ~20 topic.
- `1779638801391-createViews.ts` + `1779638820330-grantChatbotReadonly.ts`: view/role chỉ đọc ban đầu cho chatbot.
- `1786530000000-addAppointmentExpiredStatus.ts`: thêm giá trị enum `EXPIRED`.
- `1786600000000-addUniqueDoctorScheduleDateIndex.ts`: index unique có điều kiện chống double-book.
- `1786700000000-createCoachProfile.ts` + `1786700000001-seedCoachProfilePermission.ts`.
- `1786800000000-seedAdminReportPermission.ts`, `1786900000000-seedEnterpriseReportPermission.ts`.
- `1787000000000-seedTransactionalData.ts`: seed giao dịch demo mở rộng (settings, relatives, health profiles, appointments, examination results, ratings, notifications, complaints, coach profiles, audit logs, channels, messages).
- `1787100000000-seedAdminFullPermissions.ts`: CROSS JOIN cấp toàn bộ permission hiện có cho ADMIN (xem `permissions.md`/`known-ambiguities.md`) — `down()` là no-op.
- `1787200000000-upgradeNotificationsForRealtime.ts`: đổi tên `is_notified`→`is_read`, thêm `type`/`action_url`/`metadata`, composite index.
- `1787300000000-addUserAndSystemSettings.ts` và `1787300000000-secureChatbotReporting.ts` **trùng timestamp prefix** — `[UNCERTAIN]` thứ tự áp dụng thực tế giữa 2 migration này chưa được kiểm chứng qua bảng `migrations` thật, chỉ dựa trên tên file.
- `1787400000000-secureOtpAndPasswordReset.ts`: thay thiết kế OTP plaintext + boolean `verified` cũ (nay `[DEAD CODE]`, chỉ còn thấy trong `down()`) bằng `otp_hash`/`reset_tokens` có hash.
- `1787500000000-seedMessageUpdatePermission.ts`: cấp `message:update` bổ sung cho DOCTOR/PATIENT.
- `1787500000001-addMessagingIndices.ts`: index hiệu năng cho messages/channel_members.

## Read-only reporting views cho chatbot (`chatbot_readonly` DB role)

`1787300000000-secureChatbotReporting.ts` siết chặt role `chatbot_readonly`: `default_transaction_read_only=on`, `statement_timeout=15s`, thu hồi `CREATE` trên schema `public`, yêu cầu `CHATBOT_DB_PASSWORD` ≥16 ký tự lúc chạy migration. Views tạo/giữ: `chatbot_report_users_view` (nhân khẩu học ẩn danh theo nhóm tuổi/vùng/giới/role, chỉ số đếm gộp — không lộ PII thô), `chatbot_report_coach_profiles_view` (trung bình age/height/weight bị ẩn nếu nhóm có <5 hồ sơ — ngưỡng k-anonymity), `chatbot_report_audit_view`, `chatbot_report_appointments_view`, `chatbot_report_doctor_schedules_view`, `chatbot_report_doctors_view`, `chatbot_report_specialties_view`. `chatbot/` còn dùng riêng 3 view khác cho SQL-QA hướng bệnh nhân (`doctors_view`, `articles_view`, `specialties_view`, định nghĩa entity ở `chatbot/src/entities_view/`).

## Demo/seed data

Dữ liệu seed (role/permission/chuyên khoa/user/doctor/lịch/relative/health-profile/appointment/exam-result/rating/notification/complaint/coach-profile/audit-log/channel/message) là dữ liệu phát triển/demo, không phải bản ghi production.

**Implementation Evidence**

- Toàn bộ file entity dưới `backend/src/entities/`
- `backend/src/database/migrations/` (danh sách nêu trên)
- `chatbot/src/entities_view/`, `chatbot/src/database/data-source.ts`
