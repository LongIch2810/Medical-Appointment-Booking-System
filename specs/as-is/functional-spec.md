# Functional specification — AS-IS

## Cách đọc

Mỗi nhóm ghi rõ actor, entry point, hành vi đã thấy và bằng chứng. Những phần chỉ là UI/mock được đánh dấu riêng. Tài liệu này đã qua một vòng xác minh lại (đọc trực tiếp cả 4 service với trích dẫn `file:line`); các mục sửa lại so với bản trước được ghi rõ.

## 1. Public và patient web

### Public pages — `CONFIRMED`

Visitor vào được: home, doctors (list), contact, FAQ, terms, team, careers, news/news detail, sign-in, sign-up, forgot-password, not-found. `Doctor detail`, `feedback`, `chatbot` và toàn bộ subtree `/patient` nằm sau `RouteProtected` (yêu cầu đăng nhập **và** role `PATIENT`; thiếu role → `/403`).

Còn một route `/test` (`Test.tsx`) không nằm sau bất kỳ guard nào, là trang scratch/demo (calendar component) còn sót trong route table — `[UNCERTAIN]` có chủ ý giữ lại để QA thủ công hay là sót.

**Implementation Evidence**

- `frontend/src/routes/AppRoutes.tsx`, `RouteProtected.tsx`

### Authentication — `CONFIRMED`

- Đăng nhập/đăng ký/Google OAuth: xem chi tiết `user-flows.md` §1–2 và `business-rules.md` §Authentication.
- **Quên mật khẩu — `[NOT IMPLEMENTED]` ở bước cuối**: `ForgotPassword.tsx` có luồng 3 bước (email → OTP → đặt mật khẩu mới) gọi đúng `POST /otps/send-otp` và `POST /otps/verify-otp` ở 2 bước đầu, nhưng **bước cuối không gọi API nào** — chỉ `setTimeout` 1 giây rồi báo thành công giả (code tự nhận đây là placeholder). Backend có `POST /auth/set-new-password` khả dụng nhưng frontend chưa nối vào bước này.

**Implementation Evidence**

- `backend/src/modules/auth/auth.controller.ts`, `auth.service.ts`, `otps.controller.ts`, `otps.service.ts`
- `frontend/src/pages/SignIn.tsx`, `SignUp.tsx`, `ForgotPassword.tsx`
- `frontend/src/configs/axios.ts`

### Doctor discovery and booking — `CONFIRMED`

Danh sách/chi tiết bác sĩ, bộ lọc (chuyên khoa/kinh nghiệm/nơi làm việc/khu vực/tìm kiếm, đồng bộ 2 chiều với URL), 2 luồng đặt lịch (thủ công theo bác sĩ cụ thể; nhanh/tự động theo chuyên khoa+giờ) đều gọi API thật `POST /appointments/booking`. Xác nhận đặt lịch trong UI là **kết hợp HTTP + Socket.IO**: HTTP trả 201 ngay nhưng phản hồi UI (đóng dialog) chỉ chạy trên `onSuccess` của mutation; việc cập nhật cache lịch/slot còn trống và toast lỗi thật sự đến từ sự kiện socket `appointment:success`/`appointment:fail`/`appointment:slotBooked`. Booking nhanh (`DialogAutoBooking`, mở từ `/doctors` chứ không từ trang chi tiết bác sĩ) không mount hook lắng socket đó, nên không có cập nhật cache slot tức thời cho chính entry point này.

**Implementation Evidence**

- `backend/src/modules/appointments/appointments.controller.ts`, `appointments.service.ts`
- `backend/src/modules/doctors/doctors.controller.ts`
- `frontend/src/pages/Doctor.tsx`, `DoctorDetail.tsx`
- `frontend/src/hooks/useDoctorBooking.ts`, `useAutoBooking.ts`, `useNotifyAppointmentSocket.tsx`
- `frontend/src/components/dialog/DialogAutoBooking.tsx`, `AlertDialogConfirmBook.tsx`

## 2. Patient portal

Routes: `/patient` (dashboard), `/patient/profile`, `/patient/appointments`, `/patient/notifications`, `/patient/relatives`, `/patient/settings`, `/patient/messages`, `/patient/health-records`, `/patient/visit-results`, `/patient/ai-coach-health`, `/patient/complaints`.

### `[SỬA LẠI]` Trạng thái nối API — nay `CONFIRMED`, không còn `PARTIAL`

Bản trước đánh giá patient portal là `PARTIAL`/mock vì `PatientPortalContext.tsx` khởi tạo dữ liệu từ `patientMockData.ts`. **Xác minh lại xác nhận `PatientPortalContext`/`patientMockData.ts`/`usePatientPortal.ts` là `[DEAD CODE]`**: `PatientPortalProvider` không được mount ở bất kỳ layout nào, `usePatientPortal()` không có nơi gọi ngoài file định nghĩa của chính nó (grep repo-wide). Mọi trang patient portal thực tế đọc/ghi qua `src/hooks/usePatientPortalApi.ts` (TanStack Query) → `src/api/*.ts` → API thật:

| Trang | Nguồn dữ liệu thật | Business rule/hành vi đáng chú ý |
|---|---|---|
| Dashboard | `GET /dashboard/patient` | Đếm lịch sắp tới/hồ sơ sức khỏe/kết quả khám/người thân; fallback "Chưa cập nhật" khi null. |
| Profile | `PATCH /users/update-info` (multipart) | Avatar ≤5MB (chặn client-side); username/email disabled không sửa được. |
| Relatives | `POST/PATCH/DELETE /relatives*` | Tạo/sửa/xóa người thân; xóa có xác nhận. |
| Health records | `PATCH /health-profiles/update/:relativeId` | Số liệu đo lường validate min/max ở form; sentinel "unspecified" cho field optional. |
| Appointments | `POST /appointments/personal-appointments`, `DELETE /appointments/cancel/:id`, `POST /satisfaction-rating/create-rating` | Hủy chỉ khi `PENDING`; đánh giá chỉ khi đã hoàn thành + có kết quả khám + chưa đánh giá. |
| Visit results | `POST /examination-result/personal/list` | Chỉ đọc; tìm kiếm chỉ lọc client-side trên trang đã tải, không gửi lên server. |
| Complaints | `POST /complaints/create`, `POST /complaints/my` | Có 2 entry point UI trùng chức năng: `Complaints.tsx` (đầy đủ) và `Feedback.tsx` (`/feedback`, rút gọn, cùng mutation). |
| Messages | `patientApi` (channels/messages) + Socket.IO | Xem §Messaging bên dưới — có 2 cài đặt chat song song trong toàn app. |
| Settings | `GET/PATCH /user-settings/me` | Xem điểm cụt bên dưới. |
| AI Coach Health | `GET/POST/PATCH /coach-profile*`, legacy `POST /chat-history/build-health-roadmap` | CRUD coach profile vẫn tồn tại; backend roadmap entry point không hoạt động end-to-end vì chatbot router hiện không expose `/build-health-roadmap`. |

### `[NOT IMPLEMENTED]` Các điểm cụt đã xác nhận trong patient portal

- `Settings.tsx` tab Privacy: 3 toggle (`shareDoctorHistory`, `autoSyncReports`, `anonymousResearch`) là state cục bộ thuần túy, **không** nằm trong payload lưu (`handleSaveAll()`), reset về mặc định khi tải lại trang.
- `Contact.tsx` (trang liên hệ, ngoài patient portal nhưng cùng nhóm public/patient web): form chỉ `console.log` + toast giả, không gửi request nào.

**Implementation Evidence**

- `frontend/src/hooks/usePatientPortalApi.ts` (nguồn dữ liệu thật)
- `frontend/src/pages/patient/*.tsx` (Profile, Relatives, HealthRecords, Appointments, VisitResults, Complaints, Messages, Settings, Dashboard)
- `frontend/src/pages/patient/PatientPortalContext.tsx`, `usePatientPortal.ts`, `patientMockData.ts` (dead code, không dùng)
- `frontend/src/pages/Feedback.tsx`, `Contact.tsx`

## 3. Doctor/admin console (`admin/`)

Guard: `ProtectedRoute` (yêu cầu session) → `PermissionRoute` (yêu cầu permission cụ thể của route). `menuItems` (`admin/src/config/menu.ts`) là nguồn duy nhất cho sidebar/command-palette/route tự sinh; các entry có `moduleId` được render qua `GenericModulePage`, còn lại (dashboards, reports, role-permission, settings) được route thủ công.

### `[SỬA LẠI/LÀM RÕ]` Mock vs. API thật — chỉ **1 trang** dùng mock, không phải "nhiều màn hình"

`admin/src/services/mockApi.ts` có 5 method nhưng chỉ **1** (`getEnterpriseReportGroups`) còn có nơi gọi thật — 4 method còn lại (`getProfiles/getDashboard/getModule/getMessages/getRolePermissions`) không có importer nào ngoài chính file, là `[DEAD CODE]`. `src/components/app/DataTable.tsx` + `src/mock/modules*.ts` là scaffold generic-module cũ, cũng không còn được dùng.

| Trang | Nguồn dữ liệu | 
|---|---|
| `EnterpriseReportsDashboardPage` (`/admin/enterprise-reports`) | **MOCK** — `mockApi.getEnterpriseReportGroups()`, fixture tĩnh `src/mock/enterpriseReports.ts`, delay giả 220ms. Chỉ là danh mục loại báo cáo, không có khả năng sinh báo cáo thật. |
| Mọi trang/module khác (17 module `GenericModulePage`, 2 dashboard, messaging, notifications, settings, 2 tính năng AI, role-permission) | **API thật**, mỗi module 1 cặp `use<Resource>`/`<resource>Api.ts` riêng. |

Hai menu item dễ nhầm lẫn vì tên gần giống: `admin/ai-coach-reports` (AdminAiReportGeneratorPage — sinh báo cáo AI thật theo yêu cầu, dữ liệu sống) và `admin/enterprise-reports` (catalog mock tĩnh, không sinh báo cáo).

### Doctor workspace — `CONFIRMED`

Dashboard, lịch làm việc (self-service, `POST /doctor-schedules/personal-schedules` + CRUD riêng, UI dạng tab-theo-ngày không dùng bảng chung), lịch hẹn (dùng chung API admin-appointments filter theo `doctorId` — xem bug đã biết bên dưới), tin nhắn, hồ sơ khám (`ExamResultsModule`), settings (dùng chung với admin qua `DoctorSettingsPage`, route `/account/settings` không permission-gate). (Tóm tắt bệnh án AI đã bị gỡ bỏ — xem mục 4.)

### Admin operations — `CONFIRMED`

Dashboard, quản lý user/doctor/patient (patient module chỉ đọc — không có create/update/delete UI dù route yêu cầu `patient:manage`), nội dung (tags/topics/articles — articles chỉ approve/delete, không có UI tạo/sửa bài viết trong `admin/`), lịch hẹn, ca khám, kết quả khám, đánh giá hài lòng (chỉ sửa, không tạo/xóa), khiếu nại (không có nút "từ chối" dù trạng thái `rejected` tồn tại), thông báo (gửi 1-1, không broadcast), audit log (chỉ xem, deep-link filter từ Settings bị rơi query param), role-permission (3 chế độ xem: card/matrix/catalog), báo cáo AI, health-profiles/relatives/relationships/specialties (relationships dùng `relationship_code` làm khóa, không phải id số).

### `[CONFLICT]` Backend bug đã biết, được né tránh ở tầng UI

`GET /appointments/doctor/appointments` được ghi nhận (2 comment độc lập trong `admin/`) là lỗi server-side (truy cập `user.doctor.id` không eager-load quan hệ). `admin/` né bằng cách tự tra `Doctor` hiện tại qua `useCurrentDoctor()` rồi gọi endpoint admin-appointments với filter `doctorId` — dùng cho cả Doctor Dashboard và module lịch hẹn theo scope doctor.

**Implementation Evidence**

- `admin/src/config/menu.ts`, `admin/src/routes/AppRoutes.tsx`, `admin/src/pages/GenericModulePage.tsx` (~4900 dòng)
- `admin/src/pages/AdminDashboardPage.tsx`, `DoctorDashboardPage.tsx`, `RolePermissionPage.tsx`, `EnterpriseReportsDashboardPage.tsx`, `AdminAiReportGeneratorPage.tsx`
- `admin/src/hooks/useCurrentDoctor.ts`
- `admin/src/services/mockApi.ts`, `admin/src/components/app/DataTable.tsx`

## 4. Chatbot and AI

### Production HTTP surface — `CONFIRMED`

The Express router mounted at `/chatbot` currently registers exactly four operations: `POST /chat`, `POST /patient-chat`, `DELETE /patient-chat/conversations/:conversationId`, and `POST /report-assistant`. Every route requires the internal service key. Patient-chat and report-assistant additionally require a forwarded Bearer JWT whose verified subject matches `userId`. Browser clients call the NestJS backend only; they do not call the chatbot service directly.

Diagnosis code still exists but has no production route and remains `[DEAD CODE]`. Older create-report, health-roadmap and medical-record-summary implementations/files may remain in source history, but the current router does not expose those HTTP endpoints; documents must not describe them as live chatbot routes.

### Patient multi-thread chatbot (2026-09)

The `/chatbot` page supports owner-private conversations with paged transcripts, create/switch/soft-delete, a mobile conversation sheet and the medical disclaimer. Application tables remain the transcript/audit source; a derived `patient-chat:v1:{userId}:{conversationId}` LangGraph thread stores bounded execution state. Cross-thread memory is limited to explicit language/detail/scheduling preferences and excludes health data, chat text, JWTs and SQL.

The agent can use RAG, read-only SQL-QA, medical safety guidance and booking. Doctor search, recommendations, availability lookup and messages containing “chưa đặt lịch” stay in lookup mode; booking is invoked only for an explicit request to create an appointment. Patient-facing output is sanitized so internal query/tool terminology is not returned.

Booking uses a two-phase protocol. The tool creates a proposal only, then native `interrupt()` waits for an explicit approval. The current approval card shows **Xác nhận đặt lịch** and **Chỉnh sửa** only; it has no cancel button. Approval calls `POST /api/v1/appointments/booking` with a unique operation UUID, so retries return the same appointment without duplicate notification side effects. Editing resumes as `REVISE`. The backend and graph retain `CANCEL` compatibility for stored messages or older clients, but the current patient UI does not send it.

### Admin multi-turn report assistant (2026-09)

The `/admin/ai-report-assistant` screen creates owner-private conversations, supports clarification/follow-up turns, and presents a proposed plan that requires a dedicated confirmation button before SQL → chart → grounded content → PDF runs. A normal message while approval is pending revises and replaces the plan. Confirmed reports create new `ai_admin_reports` rows linked to the conversation; prior versions are not overwritten.

Explicit monthly requests are normalized to supported source views and calendar buckets. For “N tháng gần nhất” grouped by month, the start is the first day of the month `N-1` months before the current month and the end is today. This yields exactly N calendar buckets. The admin preview localizes known column labels, weekdays, roles, ISO month values and start/end times for table display and CSV export.

The report history screen filters by report type and exposes refresh, detail preview, PDF open/download, and owner-scoped deletion. PDF readiness is shown explicitly. Deletion requires a confirmation dialog; the backend removes the stored output asset and soft-deletes the report after owner/admin authorization. The create CTA no longer uses the previous sparkle icon.

Revenue/financial requests are refused because no approved finance reporting view exists. Generated SQL is validated and repaired within a bounded retry path; unsupported numeric claims fail grounding before PDF generation. The chatbot endpoint applies 30 assistant turns per 5 minutes and 10 confirmed report generations per hour per verified user.

Native LangGraph persistence uses one stable owner-scoped thread per application conversation with `PostgresSaver`; `PostgresStore` keeps only explicit allowlisted report preferences. The dedicated login comes from `LANGGRAPH_DB_USER`/`LANGGRAPH_DB_PASSWORD`. The chatbot uses the configured login exactly and does not append a Supabase project reference.

**Implementation Evidence**

- `chatbot/src/routes/chatbot.route.ts`, `chatbot/src/controllers/chatbot.controller.ts`
- `chatbot/src/langgraph/patient_chat.graph.ts`, `report_assistant.graph.ts`, `booking.graph.ts`
- `backend/src/modules/chat-history/`, `backend/src/modules/admin-reports/`
- `frontend/src/pages/Chatbot.tsx`, `frontend/src/components/chatbot/BookingApprovalCard.tsx`
- `admin/src/pages/AdminAiReportAssistantPage.tsx`, `admin/src/components/app/ReportAssistantPreview.tsx`
## 5. Cross-cutting behavior

- Validation: `ValidationPipe({transform:true, whitelist:true})` toàn cục (field lạ bị loại âm thầm, không từ chối).
- Response: mọi phản hồi thành công qua `ResponseInterceptor`; mọi lỗi qua `HttpExceptionFilter` (không rò rỉ chi tiết nội bộ cho lỗi 500).
- Audit: `WriteAuditLogInterceptor` (global `APP_INTERCEPTOR`) chỉ ghi log cho handler có `@AuditLogAction(...)` — bao phủ hầu hết route mutating, không bao phủ route đọc công khai. Ghi log qua BullMQ (fire-and-forget) — nếu user liên quan bị xóa đúng lúc job chạy, log đó bị mất vĩnh viễn (job fail, không retry vô hạn).
- Background work: BullMQ cho email (OTP/welcome/lịch hẹn), upload file (Cloudinary metadata → DB), audit log — mỗi queue có retry với backoff riêng.
- Files: Cloudinary dùng cho avatar, tin nhắn/bài viết đính kèm, và PDF báo cáo/lộ trình sức khỏe do chatbot sinh.

**Implementation Evidence**

- `backend/src/main.ts`, `backend/src/app.module.ts`
- `backend/src/common/interceptors/`, `backend/src/common/filters/http-exception.filter.ts`
- `backend/src/bullmq/`, `backend/src/uploads/`
