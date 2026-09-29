# User flows — AS-IS

## 1. Patient authentication

```text
Visitor -> /sign-in -> POST /api/v1/auth/login
        -> server validates local credentials and role PATIENT
        -> accessToken/refreshToken cookie (httpOnly, sameSite=strict)
        -> frontend explicitly re-fetches GET /users/info to populate profile cache
        -> navigate("/")
```

Register: `POST /auth/register` → chỉ điều hướng `/sign-in`, **không** tự đăng nhập. Google: redirect toàn trang tới `${backend}/auth/google` (không có SDK OAuth phía client), backend xử lý toàn bộ callback và set cookie.

**Quên mật khẩu — luồng bị cụt ở bước cuối (`[NOT IMPLEMENTED]`):**
```text
ForgotPassword.tsx: email -> POST /otps/send-otp (thật)
                  -> otp   -> POST /otps/verify-otp (thật)
                  -> reset -> setTimeout giả lập 1s, KHÔNG gọi API nào
                           -> toast "thành công" giả, navigate /sign-in
                           (mật khẩu KHÔNG thực sự đổi)
```
`POST /auth/set-new-password` tồn tại ở backend nhưng chưa được frontend gọi ở bước này.

**Implementation Evidence**

- `backend/src/modules/auth/auth.controller.ts`, `auth.service.ts`
- `backend/src/modules/otps/otps.controller.ts`, `otps.service.ts`
- `frontend/src/pages/SignIn.tsx`, `SignUp.tsx`, `ForgotPassword.tsx`
- `frontend/src/hooks/useLogin.tsx`, `useRegister.tsx`

## 2. Session expiry and refresh

```text
API response 401 -> axios interceptor kiểm tra không phải /auth/login|register
                 -> nếu đang refresh: xếp hàng (failedQueue), replay sau khi refresh xong
                 -> nếu chưa: POST /auth/refresh (rotate token)
                 -> thành công: replay request gốc
                 -> thất bại: best-effort POST /auth/logout, reset store,
                    redirect cứng tới /sign-in CHỈ NẾU path hiện tại không nằm
                    trong danh sách public (/, /doctors, /news, /contact, /faq,
                    /terms, /team, /careers, /sign-in, /sign-up)
```

WebSocket có luồng refresh song song riêng (`socket.ts`): nhận `ws-error{code:401}` → gọi `/auth/refresh` → reconnect socket cùng instance; thất bại thì hủy sự kiện đang chờ và ngắt kết nối, **không** tự redirect (để lần gọi HTTP tiếp theo xử lý qua interceptor trên).

Server rotate refresh token mỗi lần dùng (single-use), theo dõi session qua `session_version`/`refresh_tokens`/`blacklist` trong Redis.

## 3. Doctor discovery to appointment (2 luồng song song, cùng đích)

```text
[Thủ công] Patient -> /doctors -> chọn bác sĩ -> /doctors/:id -> chọn ngày/ca
        -> AlertDialogConfirmBook (bắt buộc chọn "người thân" kể cả đặt cho bản thân)
        -> POST /appointments/booking {appointment_date, doctor_schedule_id, relative_id, booking_mode:"user_select"}
        -> HTTP 201 => đóng dialog (KHÔNG toast thành công ở đây)
        -> song song: socket "appointment:success" => patch cache slot + toast + invalidate
                                                       ["patient-appointments"], ["patient-dashboard"]
           hoặc "appointment:fail" => toast lỗi

[Nhanh/tự động] Patient -> /doctors -> "Đặt lịch nhanh" -> chọn/tạo người thân + chuyên khoa + giờ
        -> POST /appointments/booking {..., specialty_id, start_time, booking_mode:"user_select"}
        -> đóng dialog khi thành công
        -> KHÔNG mount hook lắng socket ở entry point này => không có patch cache slot tức thời
           (dữ liệu vẫn đúng ở lần fetch tiếp theo /patient/appointments)
```

Tính duy nhất của slot được bảo đảm cuối cùng bởi unique index DB (`unique_doctor_schedule_date`), không chỉ dựa vào kiểm tra ở service.

**Implementation Evidence**

- `frontend/src/pages/DoctorDetail.tsx`, `frontend/src/components/dialog/{AlertDialogConfirmBook,DialogAutoBooking}.tsx`
- `frontend/src/hooks/{useDoctorBooking,useAutoBooking,useNotifyAppointmentSocket}.tsx`
- `backend/src/modules/appointments/appointments.service.ts`

## 4. Patient portal flow — `[SỬA LẠI]`

```text
/patient -> PatientLayout -> Outlet page (Profile/Relatives/HealthRecords/
            Appointments/VisitResults/Complaints/Messages/Settings/Dashboard)
         -> hook riêng của từng trang (usePatientPortalApi.ts, TanStack Query)
         -> API thật (backend) -> Postgres
         -> invalidate query key liên quan -> re-render
```

Bản trước mô tả luồng này đi qua `PatientPortalContext` (React Context khởi tạo từ mock data, mutation chỉ đổi state trong bộ nhớ). Xác minh lại: `PatientPortalProvider` **không được mount** ở bất kỳ đâu trong `AppRoutes.tsx`/layout, và `usePatientPortal()` không có nơi gọi ngoài file định nghĩa — luồng mock này là `[DEAD CODE]`, không phải luồng đang chạy. Luồng thật là bảng trên, per-page hook → API thật, như mọi feature khác trong `frontend/`.

Các điểm cụt còn tồn tại trong luồng thật (không liên quan tới context mock): 3 toggle Privacy trong Settings không được lưu; form liên hệ (`Contact.tsx`, ngoài `/patient` nhưng cùng nhóm) không gửi gì.

## 5. Doctor/admin module flow

```text
/ -> ProtectedRoute (yêu cầu session) -> AdminLayout -> RootRedirect
  -> đường dẫn menu đầu tiên mà user có quyền (ưu tiên khớp workspace /admin hoặc /doctor)
  -> PermissionRoute (yêu cầu permission cụ thể của route)
  -> trang riêng hoặc GenericModulePage(moduleId)
  -> hook/API -> backend controller/service -> DB (hoặc mockApi cho đúng 1 trang, xem functional-spec.md)
```

Thiếu session → `/login`; thiếu permission → `/403`. Backend độc lập áp `PermissionsGuard` bất kể UI đã lọc menu hay chưa — UI chỉ là lớp trải nghiệm.

## 6. Messaging flow (2 cài đặt song song trong `frontend/`, 1 trong `admin/`)

```text
Browser -> Socket.IO handshake bằng cookie accessToken
        -> WsCookieAuthGuard xác thực lại MỖI event (không chỉ lúc connect)
        -> join phòng user:<id>
        -> channel:join (kiểm tra thành viên) -> phòng room:<channelId>
        -> send:message (rate-limit 30/phút riêng)
        -> MessagesService mã hóa nội dung, lưu DB, decrypt khi trả về
        -> emit receive:message tới room:<channelId>
```

`frontend/` có **2 implementation độc lập** cùng gọi chung endpoint backend: trang đầy đủ `Messages.tsx` (`/patient/messages`) và widget nổi `ChatBox.tsx`/`ChatBoxList.tsx` (ẩn trên `/patient/*` và `/chatbot`, hiện ở mọi route khác) — nguồn populate `useChannelStore` của widget nổi chưa xác định được nơi khởi tạo trong lượt nghiên cứu này. `admin/` có cài đặt riêng thứ ba (`MessagesPage.tsx`) kết hợp optimistic-update qua hook và lắng socket thô trực tiếp trong component cùng lúc.

## 7. AI flows

### Patient multi-thread chatbot

```text
Patient -> /chatbot -> tạo/chọn conversation riêng của chính user
        -> POST /api/v1/chat-history/conversations/:id/messages
        -> backend lưu user message và forward internal key + Bearer JWT
        -> POST /chatbot/patient-chat
        -> LangGraph dùng RAG, SQL-QA chỉ đọc, tư vấn an toàn hoặc booking proposal
        -> backend lưu assistant message -> frontend cập nhật transcript
```

Yêu cầu tìm/gợi ý bác sĩ, xem lịch trống hoặc nói rõ “chưa đặt lịch” chỉ chạy tra cứu. Chatbot chỉ mở luồng booking khi người dùng yêu cầu đặt/tạo lịch rõ ràng. Nội dung trả cho patient được làm sạch để không lộ SQL, tên bảng/view, “kết quả truy vấn” hoặc tên công cụ nội bộ.

Booking là quy trình hai pha: tool chỉ tạo đề xuất; UI hiển thị người khám, bác sĩ, chuyên khoa và ngày/giờ, đồng thời nêu rõ chưa có lịch nào được tạo. Card hiện chỉ có **Xác nhận đặt lịch** và **Chỉnh sửa**, không có nút hủy. Chỉ nút xác nhận mới resume checkpoint bằng `APPROVE` và gọi API tạo lịch; chỉnh sửa gửi một lượt chat mới theo nhánh `REVISE`. Backend/chatbot vẫn hiểu quyết định `CANCEL` để tương thích với dữ liệu hoặc client cũ, nhưng patient UI hiện tại không phát quyết định này.

### Admin report assistant

```text
Admin -> /admin/ai-report-assistant -> tạo/chọn conversation
      -> gửi yêu cầu báo cáo
      -> assistant đề xuất plan và dừng tại LangGraph interrupt
      -> admin xem phạm vi/chỉ số/phân nhóm
      -> “Xác nhận và tạo báo cáo”
      -> SQL chỉ đọc -> bảng -> biểu đồ -> phân tích grounded -> PDF
      -> backend lưu report phiên bản mới và liên kết conversation
```

Tin nhắn thường khi đang chờ duyệt được hiểu là yêu cầu sửa kế hoạch. Báo cáo chỉ chạy sau thao tác xác nhận riêng. Với yêu cầu “N tháng gần nhất” có phân nhóm theo tháng, phạm vi bắt đầu từ ngày đầu của tháng cách hiện tại `N-1` tháng để tạo đúng N bucket lịch; ví dụ ngày 29/09/2026 và 6 tháng gần nhất tạo phạm vi 01/04/2026–29/09/2026. Bảng admin bản địa hóa nhãn cột, vai trò `ADMIN/DOCTOR/PATIENT`, tháng ISO và giờ trước khi hiển thị/xuất CSV.

Trang `/admin/reports/history` cho phép lọc theo loại, làm mới, xem chi tiết, mở hoặc tải PDF khi sẵn sàng, và xóa báo cáo sau hộp thoại xác nhận. CTA tạo mới dùng nhãn **Tạo báo cáo với AI** và không còn dùng icon lấp lánh cũ. Trạng thái PDF được hiển thị riêng để tránh người dùng bấm vào tệp chưa tồn tại.

Cả hai flow dùng transcript nghiệp vụ làm nguồn lịch sử chính và dùng chung `PostgresSaver`/`PostgresStore` trong schema `langgraph` cho checkpoint cùng preference memory có allowlist. Nếu persistence không sẵn sàng, request fail closed bằng lỗi 503 ổn định; không chạy graph stateless.

Route diagnosis vẫn là dead code vì không được đăng ký trong router production. Router chatbot hiện chỉ expose `POST /chat`, `POST /patient-chat`, `DELETE /patient-chat/conversations/:conversationId` và `POST /report-assistant`.

**Implementation Evidence**

- `frontend/src/pages/Chatbot.tsx`, `frontend/src/components/chatbot/BookingApprovalCard.tsx`
- `admin/src/pages/AdminAiReportAssistantPage.tsx`, `admin/src/components/app/ReportAssistantPreview.tsx`
- `backend/src/modules/chat-history/`, `backend/src/modules/admin-reports/`
- `chatbot/src/routes/chatbot.route.ts`
- `chatbot/src/langgraph/patient_chat.graph.ts`, `report_assistant.graph.ts`, `booking.graph.ts`
## 8. Logout

`POST /auth/logout` blacklist/xóa phiên refresh hiện tại, xóa cookie. `POST /auth/logout-all` tăng `session_version` (vô hiệu mọi access/refresh token đang có ngay lập tức) và xóa toàn bộ `refresh_tokens`. Đổi permission của **role** cũng kích hoạt hiệu ứng tương tự logout-all cho mọi user giữ role đó; đổi **role của một user cụ thể** thì không (xem `[CONFLICT]` trong `known-ambiguities.md`).

`[UNCERTAIN]` `useLogout` (frontend patient) gọi `navigate("sign-in")` (đường dẫn tương đối, không có dấu `/` đầu) trong khi mọi luồng auth khác dùng `navigate("/sign-in")` (tuyệt đối) — có thể điều hướng tới vị trí không như mong đợi tùy route hiện tại lúc logout.
