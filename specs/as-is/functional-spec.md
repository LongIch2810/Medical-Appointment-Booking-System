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
| AI Coach Health | `GET/POST/PATCH /coach-profile*`, `POST /chat-history/build-health-roadmap` | Tạo lộ trình sức khỏe PDF qua chatbot service (backend proxy). |

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

### Chat / RAG / SQL-QA / đặt lịch qua hội thoại — `CONFIRMED`

Chatbot Express mount `/chatbot`, hiện có chat, patient-chat (POST/DELETE), report, admin report-assistant và health-roadmap routes. Các route yêu cầu internal-service-key; patient-chat và report-assistant yêu cầu Bearer JWT có subject khớp `userId`. Patient-chat rate-limit theo actor. `/create-report` cũ không xác thực theo user, chỉ theo internal key (rate-limit theo IP). Backend (`chat-history` module) là lớp trung gian duy nhất mà `frontend`/`admin` gọi tới — không client nào gọi thẳng `chatbot/`.

Agent hội thoại chính có 4 tool: RAG (Qdrant), SQL-QA (3 view đọc-only), tư vấn y tế (red-flag khẩn cấp bằng regex) và booking. Trong luồng patient-chat mới, booking tool chỉ lập đề xuất; native `interrupt()` đợi người dùng xác nhận, rồi mới resume bằng `Command({ resume })` để gọi `POST /api/v1/appointments/booking`. Tin nhắn thông thường khi chờ xác nhận được hiểu là chỉnh sửa, không phải đồng ý.

### `[SỬA LẠI]` Chẩn đoán (Diagnosis) — `[DEAD CODE]`, không phải tính năng đang hoạt động

CLAUDE.md liệt kê "diagnosis" là một trong các LangGraph flow của `chatbot/`. Xác minh: `diagnosis.graph.ts` + `handleDiagnosisController`/`handleDiagnosisService` được implement đầy đủ (bao gồm phân tích triệu chứng, chẩn đoán xác suất theo bệnh, gợi ý lâm sàng) nhưng **không route HTTP nào đăng ký gọi tới** — xác nhận bởi chính test tích hợp của service (`chatbot/test/integration/chatbot.route.integration.spec.ts`, mock hàm này để throw lỗi "not exposed by the production router"). Tính năng này hiện không thể truy cập qua bất kỳ client nào trong hệ thống.

### Reports and roadmap — `CONFIRMED`

`admin-reports` (backend) legacy generator forward câu hỏi ngôn ngữ tự nhiên tới `chatbot` `create-report` (SQL-QA trên 8 view báo cáo, sinh biểu đồ + báo cáo văn bản + PDF, PDF **không** stream về mà upload Cloudinary và chỉ trả URL). Admin còn có hội thoại báo cáo nhiều lượt tại `/admin/ai-report-assistant`: trợ lý làm rõ/yêu cầu xác nhận kế hoạch trước khi dùng chung pipeline SQL → biểu đồ → grounded report → PDF. "Health roadmap" tương tự cho patient (`AICoachHealth.tsx` → `build-health-roadmap`), có 2 bước tạo nội dung (`GenerateHealthPlanNode`, `WriteHealthRoadmapReportNode`) thực chất là **code xác định (deterministic), không gọi LLM** dù nằm trong một graph tên gợi ý AI.

### Medical-record upload/summary — `[REMOVED]`

Đã tồn tại (nhận `images`/`pdf`, OCR bằng vision model, tóm tắt Markdown, entry point `admin/`'s `MedicalRecordSummaryPage` tại `/doctor/patient-records`), nhưng đã bị gỡ bỏ hoàn toàn (route `/chatbot/upload/summary-medical-record`, `ocr_tool`, `summary_medical_record_tool`/graph, `AiMedicalRecordSummary` entity + bảng DB, toàn bộ UI `admin/`) sau khi liên tục gặp lỗi độ tin cậy khi trích xuất (nhầm field, tự suy diễn/tính toán giá trị, lẫn nội dung chẩn đoán vào tóm tắt xét nghiệm) không ổn định trên `gpt-4o-mini` dù đã nhiều vòng chỉnh prompt. Không còn entry point nào cho tính năng này.

**Implementation Evidence**

- `chatbot/src/routes/chatbot.route.ts`, `chatbot/src/controllers/chatbot.controller.ts`, `chatbot/src/services/chatbot.service.ts`
- `chatbot/src/langgraph/{booking,diagnosis,create_report,build_health_roadmap}.graph.ts`
- `chatbot/test/integration/chatbot.route.integration.spec.ts`
- `backend/src/modules/chat-history/`, `backend/src/modules/admin-reports/`
- `admin/src/pages/AdminAiReportGeneratorPage.tsx`
- `frontend/src/pages/Chatbot.tsx`, `AICoachHealth.tsx`

### Admin multi-turn report assistant (2026-09)

The separate `/admin/ai-report-assistant` screen creates owner-private conversations, supports clarification and follow-up turns, and presents a proposed plan that requires an explicit confirmation button before the shared SQL → chart → grounded content → PDF pipeline runs. Confirmed reports are versioned as new `ai_admin_reports` rows and linked to the conversation; prior reports are not overwritten. The chatbot router now also exposes `/chatbot/report-assistant` with verified-user quotas. Revenue/financial requests are refused because no such reporting view exists, and unsupported numeric claims are rejected before PDF generation. The older `/admin/ai-coach-reports` generator remains available in parallel. No finance data, patient chat history reuse, or new permission was introduced.

Native LangGraph persistence is enabled for this assistant: one stable `thread_id` per owner-scoped application conversation uses `PostgresSaver` checkpoints for short-term state, and `PostgresStore` keeps only explicitly requested report preferences per admin across threads. A plan creates a native `interrupt()` pause; backend confirmation resumes that checkpoint with `Command({ resume })`. A follow-up message resumes the pending interruption as a revision, discarding the previous plan. Approval is not inferred from ordinary chat. Checkpointer and Store tables live in the isolated `langgraph` PostgreSQL schema under a dedicated role; application conversation/message/report tables remain the source of record.

Preference memory supports explicit remember, show, forget-one-field and forget-all commands. It is restricted to enumerated period/comparison/metrics/grouping/chart/detail defaults, is visibly noted on an applicable proposed plan, and never contains report results, patient data, SQL, arbitrary user instructions, permissions or source-view overrides. Current-turn instructions take priority. If persistence is unavailable, assistant requests fail closed with stable 503 errors rather than silently running without memory or checkpoints.

### Patient multi-thread chatbot (2026-09)

The `/chatbot` page now supports multiple owner-private conversations with cursor-paged transcripts, create/switch/soft-delete, a mobile conversation sheet and the existing medical disclaimer. The backend keeps new chat rows in `patient_chat_conversations` and `patient_chat_messages`; legacy `conversations` history is retained without backfill and remains available only through the legacy read endpoints. Every thread has an application-owned ID and derived LangGraph `thread_id=patient-chat:v1:{userId}:{conversationId}`. Transcript DB rows are the full history/audit source; `PostgresSaver` keeps bounded short-term execution state (configured message limit, 12,000 characters), and the same `PostgresStore` used by admin reports keeps only patient presentation/scheduling preferences (language, detail level, preferred weekdays, time of day) across threads.

Long-term patient memory is per verified user and only changes on explicit remember/show/forget commands; it never includes symptoms, diagnoses, medicine, allergies, relatives, chat text, JWTs, or SQL. Current instructions always win. Booking approval cards show the proposed patient, specialty, date/time and any new-relative warning. Approval creates an appointment with a unique operation UUID so resume/retry returns the same appointment and does not repeat notifications. Cancel skips the appointment API; revise routes back through the safety/topic/tool workflow. If the checkpoint is absent or stale, the backend requests a new plan and never bootstraps approval directly into commit. Conversation deletion removes its thread checkpoint but preserves long-term preferences and appointment audit relation.

Saved preferred weekdays and time-of-day are soft booking defaults only when the current request leaves them unspecified; the approval card shows the actual proposed date/time for explicit patient confirmation.

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
