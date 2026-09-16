# Known ambiguities, conflicts and gaps

> Cập nhật sau một vòng xác minh lại (research pass thứ hai, đọc trực tiếp `backend/`, `frontend/`, `admin/`, `chatbot/` với trích dẫn `file:line`). Một số mục ở bản trước đã được xác nhận chính xác hơn hoặc **sửa lại** khi bằng chứng mới mạnh hơn; các mục đã lỗi thời được thay thế thay vì giữ song song.

## `[CONFLICT]` (sửa lại) Patient portal: context mock là dead code, không phải nguồn dữ liệu đang dùng

Bản trước gắn nhãn patient portal là `PARTIAL` vì `PatientPortalContext.tsx` khởi tạo dữ liệu từ `patientMockData.ts`. Xác minh lại: `PatientPortalContext.tsx`, `PatientPortalContextObject.ts`, `usePatientPortal.ts`, `patientMockData.ts` vẫn tồn tại trên đĩa, nhưng `PatientPortalProvider` **không được mount** ở bất kỳ layout/route nào, và `usePatientPortal()` **không có nơi gọi nào** ngoài file định nghĩa của chính nó (xác nhận bằng grep toàn bộ `frontend/src`, loại trừ trùng khớp chuỗi con với `usePatientPortalApi`). Toàn bộ trang patient portal thực tế (`Profile`, `Relatives`, `HealthRecords`, `VisitResults`, `Complaints`, `Settings`, `Dashboard`, `Appointments`, `Messages`, `Notifications`) dùng `src/hooks/usePatientPortalApi.ts` (TanStack Query, gọi API thật qua `src/api/*.ts`).

**Kết luận:** `PatientPortalContext.tsx` + `patientMockData.ts` + `usePatientPortal.ts` = `[DEAD CODE]` xác nhận. Patient portal (ngoại trừ các mục `[NOT IMPLEMENTED]` liệt kê bên dưới) nên được coi là `CONFIRMED` nối API thật, không phải `PARTIAL`/mock.

**Evidence:** `frontend/src/pages/patient/PatientPortalContext.tsx`, `usePatientPortal.ts`; `frontend/src/hooks/usePatientPortalApi.ts`; grep `PatientPortalProvider`/`usePatientPortal\b` toàn repo → chỉ khớp trong file định nghĩa.

## `[NOT IMPLEMENTED]` Các điểm cụt cụ thể trong frontend patient (đã xác minh, không suy diễn)

- ~~`ForgotPassword.tsx` bước cuối chỉ `setTimeout` giả~~ — **đã fix** (commit `2ed3d163`): `handleVerifyOtp` lưu `resetToken` trả về từ OTP verify, `handleResetPassword` gọi `POST /auth/set-new-password` thật qua `setNewPassword` (`frontend/src/api/authApi.ts`). Mật khẩu đổi thật, không còn thông báo thành công giả.
- `Contact.tsx`: form "Gửi phản hồi trực tuyến" chỉ `console.log` + toast thành công giả, không gửi request nào.
- `Settings.tsx` (patient) tab Privacy: 3 toggle (`shareDoctorHistory`, `autoSyncReports`, `anonymousResearch`) là state cục bộ, **không** được gửi trong payload `handleSaveAll()` → `PATCH /user-settings/me` — reset về mặc định khi tải lại trang.
- `admin/`: `HealthProfilesModule`, `PatientsModule` không có create/update/delete UI (chỉ xem chi tiết) dù `permission` cấp module là `manage`.
- `admin/ArticlesModule`: không có UI tạo/sửa bài viết trong `admin/`; `POST /articles/create-article` tồn tại ở tầng API (`articleApi.ts`) nhưng không nơi gọi nào trong component được tìm thấy.
- `backend/`: `SatisfactionRatingService.delete()` là stub rỗng, không route nào gọi tới nó (không có `DELETE /satisfaction-rating/:id`).
- `admin/`: `useUpdateNotification`/`updateNotification` tồn tại ở hook/api layer nhưng không dialog "sửa thông báo" nào trong `GenericModulePage.tsx` gọi tới.
- `admin/ComplaintsModule`: không có nút "từ chối" (reject) khiếu nại dù `ComplaintStatus.rejected` tồn tại — chỉ có nút advance tuần tự `pending → in_progress → resolved`.
- `admin/SettingsPage.tsx`: liên kết đến `/admin/audit-logs?entity=system_configs` nhưng `AuditLogsModule` không đọc query param `entity` — điều hướng tới audit log không lọc.
- `admin/AdminDashboardPage.tsx`: bộ chọn khoảng thời gian (today/7d/30d) tồn tại trên UI nhưng không refetch/refilter gì.

## `[DEAD CODE]` xác nhận (grep repo-wide, không có importer)

- `frontend/src/pages/patient/PatientPortalContext.tsx` + `patientMockData.ts` + `usePatientPortal.ts` (xem mục đầu).
- `frontend/src/schemas/auth.schema.ts`: `forgotPasswordEmailSchema`, `resetPasswordSchema` — định nghĩa nhưng `ForgotPassword.tsx` validate inline bằng regex riêng.
- `frontend/src/api/authApi.ts`: `refresh()` export không có importer — refresh thật sự trong `axios.ts` gọi trực tiếp `refreshInstance.post("/auth/refresh")`.
- `admin/src/services/mockApi.ts`: 4/5 method (`getProfiles/getDashboard/getModule/getMessages/getRolePermissions`) không nơi gọi ngoài chính file; chỉ `getEnterpriseReportGroups()` còn được dùng thật (bởi `EnterpriseReportsDashboardPage`).
- `admin/src/components/app/DataTable.tsx` + `admin/src/mock/modules.ts`/`modules-admin.ts`/`modules-content.ts`/`modules-doctor.ts` — scaffold generic-module thời kỳ trước, bị `GenericModulePage.tsx` + `GenericList.tsx` thay thế, không còn được import.
- `admin/src/pages/*`: `useRegister`/`useSetNewPassword` định nghĩa ở `useAuth.ts`/`authApi.ts` nhưng không trang nào trong `admin/` gọi (admin không có màn đăng ký/quên-mật-khẩu riêng).
- `backend/src/utils/constants.ts` (`PERMISSIONS`): các permission `role:create/update/delete/manage` không có route CRUD permission tương ứng (chỉ có `POST /permissions` list và `GET /permissions/:id` — không create/update/delete permission qua API, permission hoàn toàn quản lý qua migration).
- `chatbot/src/tools/doctor_name_analyzer.tool.ts` (`AnalyzeDoctorTool`) — không được import ở bất kỳ graph/agent nào.
- `chatbot/src/tools/test.tool.ts` — file rỗng (0 byte), placeholder.
- `chatbot/src/langgraph/diagnosis.graph.ts` + `handleDiagnosisController`/`handleDiagnosisService` — implement đầy đủ nhưng **không route nào** đăng ký gọi tới (`chatbot/src/routes/chatbot.route.ts` chỉ đăng ký 3 route: `/chat`, `/create-report`, `/build-health-roadmap`). Xác nhận bởi chính test tích hợp: `chatbot/test/integration/chatbot.route.integration.spec.ts:66-68` mock `handleDiagnosisService` để **throw** "Diagnosis is not exposed by the production router".

## `[CONFLICT]` Maximum devices implementation

Hằng số `MAX_DEVICES = 3` (`backend/src/utils/constants.ts:1`), nhưng điều kiện loại bỏ session cũ trong `AuthService.login` là `sessions.length > 3` **trước khi** push session mới (`auth.service.ts:97`) — nghĩa là hệ thống cho phép tới 4 phiên refresh-token đồng thời trước khi loại bỏ phiên cũ nhất, không phải giới hạn cứng ở 3. Có thể là off-by-one hoặc chủ ý; không kết luận, chỉ ghi nhận.

## `[CONFLICT]` `RolesService.filterAndPagination` tìm kiếm bằng AND thay vì OR

`roles.service.ts:248-251` dùng object `where: {role_name: ILike(...), description: ILike(...)}` — TypeORM kết hợp nhiều key bằng AND, nghĩa là một role phải khớp từ khóa tìm kiếm **đồng thời** ở cả tên lẫn mô tả mới được trả về (rất có thể là bug tìm kiếm, ý định thường là OR). Đối chiếu: `PermissionsService.filterAndPagination` (`permissions.service.ts:24-30`) dùng mảng where-object (OR đúng ý định) cho cùng kiểu tìm kiếm — cho thấy đây là điểm bất nhất giữa 2 service tương tự nhau, không phải chủ ý.

## `[CONFLICT]` Dashboard doctor: `doctorId` luôn `undefined`

`DashboardController.getDoctorDashboard` đọc `req.user?.doctorId ?? req.user?.doctor?.id` (`dashboard.controller.ts:41`), nhưng `JwtStrategy.validate()` chỉ trả về `{userId, roles}` (`jwt.strategy.ts:36`) — không bao giờ set `doctorId`/`doctor`. Hệ quả: `GET /dashboard/doctor` luôn tính toán với `doctorId = undefined`, trả về số liệu rỗng/0 cho mọi bác sĩ thật, không throw lỗi nào. `admin/` đã âm thầm né tránh lỗi này bằng cách tự tra `useCurrentDoctor()` (quét `/doctors` tìm theo `user_id`) rồi gọi endpoint admin-appointments filter theo `doctorId` thay vì dùng dashboard doctor trực tiếp cho danh sách lịch hẹn — nhưng KPI đếm trong chính `GET /dashboard/doctor` (số lịch hẹn hôm nay, sắp tới...) vẫn bị ảnh hưởng bởi bug này ở tầng backend.

**Evidence:** `backend/src/modules/dashboard/dashboard.controller.ts:41`, `backend/src/modules/auth/jwt.strategy.ts:36`, `admin/src/hooks/useCurrentDoctor.ts:23-36`, `admin/src/pages/DoctorDashboardPage.tsx:91-99`.

## `[CONFLICT]` Backend documented bug: `GET /appointments/doctor/appointments`

Comment trong `admin/` (2 nơi độc lập: `DoctorDashboardPage.tsx:91-93`, `GenericModulePage.tsx:852-855`) khẳng định route backend `POST /appointments/doctor/appointments` bị lỗi vì service truy cập `user.doctor.id` mà không eager-load quan hệ `doctor`. `admin/` không sửa backend mà né tránh: tự tra `Doctor` record hiện tại rồi gọi `POST /appointments/admin/appointments` kèm filter `doctorId`. Route lỗi vẫn tồn tại và được định nghĩa trong `api-spec.md`, nhưng không nơi nào trong `admin/` còn gọi nó trực tiếp.

## `[CONFLICT]` Public `POST /articles` có thể lộ bài viết chưa duyệt

Route list bài viết công khai không có guard nào (`articles.controller.ts`), và `filterAndPagination` mặc định `is_approve=true` nhưng cho phép caller truyền `is_approve=false` để xem bài **chưa duyệt** — vì route hoàn toàn không xác thực, bất kỳ ai cũng có thể gọi `POST /articles {"is_approve": "false"}` và xem nội dung pending review. `article:read`/`article:manage` tồn tại như permission nhưng không được áp lên route này. Không rõ đây là chủ ý (để UI "duyệt bài" dùng chung endpoint public) hay sai sót.

## `[CONFLICT]` ADMIN được cấp 100% permission qua migration, ghi đè seed ban đầu

Migration `1787100000000-seedAdminFullPermissions.ts` thực hiện `CROSS JOIN` role ADMIN với **mọi** dòng hiện có trong bảng `permissions`, chèn mọi liên kết `role_permissions` còn thiếu — nghĩa là kể từ migration này, ADMIN luôn có toàn bộ permission tồn tại trong hệ thống, bất kể ý định phân quyền chi tiết ban đầu trong seed đầu tiên. `down()` của migration này là no-op (không thể phân biệt liên kết gốc và liên kết do chính nó thêm). Các migration cấp permission sau đó (`seedCoachProfilePermission`, `seedAdminReportPermission`, `seedEnterpriseReportPermission`) đều tự cấp lại cho ADMIN một cách tường minh — nên ADMIN tiếp tục có mọi permission mới về sau, không phải chỉ tính tới thời điểm migration full-permission chạy.

## `[CONFLICT]` `UsersService.updateRoles` không buộc đăng nhập lại, khác với `RolesService.updateRolePermissions`

Đổi role của một user (`PATCH /users/:userId/roles`) chỉ xóa cache `permissions:<userId>`, **không** tăng `session_version` — access token hiện có của user đó vẫn giữ nguyên claim `roles` cũ cho tới khi hết hạn tự nhiên hoặc refresh (và ngay cả refresh cũng chỉ ký lại với cùng payload roles nó nhận, không tự tra role mới từ DB). Ngược lại, sửa permission của một *role* (`PUT`/`DELETE /roles/:roleId/permissions`) gọi `invalidateRoleUsers` — tăng `session_version` VÀ xóa `refresh_tokens` cho mọi user đang giữ role đó, buộc đăng nhập lại ngay. Hai cơ chế tương tự nhau nhưng hành xử khác nhau đáng kể.

## `[CONFLICT]` (đã fix) Admin khóa/vô hiệu hóa tài khoản trước đây không có tác dụng thực tế

Trước commit `47d48eb`: `UsersService.setLocking`/`setActive` chỉ đổi cột `is_locking`/`is_active` trong DB; không nơi nào trong luồng auth (`AuthService.validateUser`, `GoogleStrategy.validate`, `SessionAuthService.assertSessionValid`) từng đọc 2 cột này. Hệ quả: tài khoản bị khóa/vô hiệu hóa vẫn đăng nhập được bình thường (kể cả đăng nhập mới) và access/refresh token đang có tiếp tục hoạt động tới khi tự hết hạn (15 phút / 7 ngày) hoặc refresh vô thời hạn — nút "Khóa"/"Vô hiệu" trên admin UI thực chất là no-op về bảo mật.

**Đã fix:** `setLocking(true)`/`setActive(false)` giờ tăng `session_version:<userId>` + xóa `refresh_tokens:<userId>` (cùng cơ chế revoke đã dùng cho đổi mật khẩu/sửa permission role) khi chuyển sang trạng thái bị chặn — đá phiên đang chạy + vô hiệu refresh token ngay lập tức. `AuthService.validateUser()` và `GoogleStrategy.validate()` đều throw `ForbiddenException` nếu `is_locking=true` hoặc `is_active=false`, chặn cả đăng nhập mật khẩu lẫn Google OAuth. Đã verify trực tiếp qua browser: khóa tài khoản bác sĩ đang có phiên mở → phiên bị đá ra ngay; đăng nhập lại bằng đúng mật khẩu bị từ chối; mở khóa thì đăng nhập lại bình thường.

**Evidence:** `backend/src/modules/users/users.service.ts` (`setLocking`, `setActive`, `revokeAllSessions`), `backend/src/modules/auth/auth.service.ts` (`validateUser`), `backend/src/modules/auth/google.strategy.ts` (`validate`).

## `[UNCERTAIN]` Ma trận chuyển trạng thái lịch hẹn — nay đã xác nhận rõ (không còn UNCERTAIN)

Bản trước đánh dấu ma trận chuyển trạng thái là `[UNCERTAIN]`. Xác minh lại: `AppointmentsService.updateStatus` (`appointments.service.ts:714-837`) định nghĩa whitelist tường minh: `PENDING → {CONFIRMED, CANCELLED}`, `CONFIRMED → {COMPLETED, CANCELLED, ABSENT}`; `COMPLETED`/`CANCELLED`/`ABSENT`/`EXPIRED` là trạng thái cuối (terminal). `EXPIRED` chỉ do cron `markExpiredPendingAppointments` gán, không thể set thủ công qua API (`BadRequestException` nếu cố set). Mọi chuyển trạng thái khác ngoài whitelist → `BadRequestException` nêu rõ from/to. Đây nay là `CONFIRMED`, không còn `UNCERTAIN`.

## `[UNCERTAIN]` Booking mode: auto-booking (REST, patient) luôn gửi `"user_select"`

`DialogAutoBooking` (frontend, "Đặt lịch nhanh") gửi cứng `booking_mode: "user_select"` dù đây là luồng "tự động chọn bác sĩ theo chuyên khoa" — giá trị `"ai_select"` tồn tại như một `booking_mode` hợp lệ khác (dùng bởi chatbot's booking graph khi đặt lịch qua hội thoại AI: `chatbot/src/langgraph/booking.graph.ts` gửi `booking_mode: "ai_select"`). Không rõ backend có xử lý khác theo giá trị này hay không (không verify được từ 2 phía frontend/chatbot riêng lẻ) — cờ này có thể chỉ mang tính thống kê/nguồn gốc đặt lịch chứ không đổi logic nghiệp vụ.

## `[TEST-ONLY EXPECTATION]` / `[CONFLICT]` `booking-chatbot.spec.ts` tìm sai input

Spec Playwright `booking-chatbot.spec.ts` dùng `page.getByPlaceholder("Aa")` trên route `/chatbot`, nhưng `Chatbot.tsx` (trang chat AI thật) có placeholder khác hẳn; chuỗi `"Aa"` chỉ tồn tại ở widget chat nổi (`ChatBox.tsx`, chat bác sĩ-bệnh nhân), và widget đó bị `MainLayout.tsx` ẩn hoàn toàn trên route `/chatbot`. Test này, như viết hiện tại, không khớp với implementation thật ở cả 2 khả năng — có thể là test lỗi thời hoặc chưa cập nhật theo UI.

## `[DOCUMENTATION ONLY]` CLAUDE.md ghi sai đường dẫn e2e và trạng thái `jest-e2e.json`

- CLAUDE.md: "`frontend/` có Playwright end-to-end specs dưới `frontend/e2e/`" — thực tế `testDir` cấu hình trong `frontend/playwright.config.ts` là `./test/e2e`, tức `frontend/test/e2e/`, không phải `frontend/e2e/`.
- CLAUDE.md: "`backend/test/jest-e2e.json` không tồn tại trong repo" — xác minh lại: file này **có tồn tại** trong checkout hiện tại (`ls`/`find` xác nhận). Ghi nhận mâu thuẫn, không tự sửa hành vi nào dựa trên đó.

## `[UNCERTAIN]` Các permission được seed nhưng không route nào gate tới

`enterprise-report:read` (dùng bởi `admin/` `EnterpriseReportsDashboardPage`, nhưng trang đó là mock — permission thật chỉ gate route/menu, không gate một backend call nào), `notification:send`, `audit-log:manage`, `patient-record:read`/`patient-record:manage` (route `/doctor/patient-records` ở `admin/` chỉ gate bằng `patient-record:manage` nhưng không backend controller nào trong `backend/src/modules` dùng permission string này — khả năng dành cho chatbot service, ngoài phạm vi backend research), full CRUD `permission:create/update/delete/manage`. Các permission này tồn tại trong catalogue/migration seed nhưng không có bằng chứng route nào đang gate bằng chúng trong backend — không kết luận là bug, có thể dành cho tính năng chưa build hoặc dùng ở service khác.

## `[UNCERTAIN]` Thứ tự thực thi interceptor toàn cục

`RemoveFieldPasswordInterceptor`/`DateFormatInterceptor`/`ResponseInterceptor` đăng ký qua `useGlobalInterceptors()` trong `main.ts`; `WriteAuditLogInterceptor` đăng ký riêng như `APP_INTERCEPTOR` global provider trong `app.module.ts`. Thứ tự thực thi tương đối chính xác giữa 2 cơ chế đăng ký này của NestJS chưa được kiểm chứng thực nghiệm trong nghiên cứu này — có khả năng `new_data` mà audit log ghi lại đã bị `DateFormatInterceptor`/`RemoveFieldPasswordInterceptor` biến đổi trước đó, nhưng chưa xác nhận.

## `[UNCERTAIN]` Runtime wiring của các thay đổi chưa commit

Working tree tại thời điểm khảo sát có nhiều file uncommitted (`git status`). Tài liệu này mô tả filesystem hiện tại, không phải một commit/release cụ thể.

## `[NOT IMPLEMENTED]` hoặc chưa xác nhận: bảo đảm vận hành

Không có bằng chứng source đủ để khẳng định production backup/restore, monitoring, audit retention, SLA, disaster recovery, tuân thủ quy định y tế, hay quy trình xóa/xuất dữ liệu hoàn chỉnh.

## Coverage / test notes

- Backend: `backend/test/unit/` có ~90+ file Jest spec, bao phủ hầu hết controller/service/guard/interceptor/decorator; spot-check `appointments.service.spec.ts` không thấy assertion mâu thuẫn với code production đã đọc trực tiếp — nhưng không phải mọi spec file đã được đối chiếu từng dòng.
- Frontend: 2 spec Playwright thật (`test/e2e/booking-manual.spec.ts`, `booking-chatbot.spec.ts` — spec thứ hai có vấn đề nêu trên), cộng 8 file unit test (axios/schemas/store/formatters/theme/normalization/socket/hook) không được đọc sâu trong pass này.
- Admin: không có test runner nào được cấu hình (theo CLAUDE.md, xác nhận không phát hiện thêm bằng chứng ngược lại).
- Chatbot: có test tích hợp thật (`test/integration/chatbot.route.integration.spec.ts`) — bằng chứng trực tiếp cho route diagnosis chưa được expose và cho việc lỗi 500 không rò rỉ message nội bộ.

## Suggested verification order

1. Chạy build/lint/test của từng service theo `package.json` hiện tại.
2. Khởi động Docker dev stack với dữ liệu demo/non-production only.
3. Kiểm thử thủ công: auth refresh/logout, tính duy nhất khi đặt lịch, phân quyền, các điểm cụt patient portal (forgot-password, contact form, privacy toggles), messaging qua websocket, upload XOR của chatbot, route diagnosis (xác nhận thật sự không thể gọi được qua HTTP).
4. Đối chiếu response quan sát được với `api-spec.md` và cập nhật bộ tài liệu AS-IS này kèm bằng chứng commit/ngày tháng.
