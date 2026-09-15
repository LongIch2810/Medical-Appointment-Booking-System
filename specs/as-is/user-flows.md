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

## 7. AI flow

```text
Frontend/admin -> POST /api/v1/chat-history/chat (hoặc build-health-roadmap)
               -> backend forward kèm x-chatbot-internal-key + access token của user
               -> chatbot /chatbot/chat|build-health-roadmap
               -> LangGraph agent chọn tool (RAG/SQL-QA/tư vấn y tế/đặt lịch)
               -> trả lời -> backend lưu vào Conversation -> trả về client
```

Đặt lịch qua hội thoại tự nhiên đi qua công cụ `booking_appointment_tool` bên trong CÙNG agent chat (`POST /chat`), không phải endpoint riêng — LLM tự quyết định gọi tool khi phát hiện ý định đặt lịch trong tin nhắn tự do. Route "chẩn đoán" (`diagnosis`) được implement đầy đủ ở tầng graph nhưng **không endpoint HTTP nào expose nó** — không có luồng người dùng nào chạm tới được (xem `known-ambiguities.md`). Báo cáo/lộ trình sức khỏe dùng rate-limit bucket riêng khỏi chat thường (12/phút so với 120/phút).

**Implementation Evidence**

- `chatbot/src/routes/chatbot.route.ts`, `chatbot/src/agents/agents.ts`
- `chatbot/src/langgraph/booking.graph.ts`, `diagnosis.graph.ts`
- `backend/src/modules/chat-history/chat-history.service.ts`

## 8. Logout

`POST /auth/logout` blacklist/xóa phiên refresh hiện tại, xóa cookie. `POST /auth/logout-all` tăng `session_version` (vô hiệu mọi access/refresh token đang có ngay lập tức) và xóa toàn bộ `refresh_tokens`. Đổi permission của **role** cũng kích hoạt hiệu ứng tương tự logout-all cho mọi user giữ role đó; đổi **role của một user cụ thể** thì không (xem `[CONFLICT]` trong `known-ambiguities.md`).

`[UNCERTAIN]` `useLogout` (frontend patient) gọi `navigate("sign-in")` (đường dẫn tương đối, không có dấu `/` đầu) trong khi mọi luồng auth khác dùng `navigate("/sign-in")` (tuyệt đối) — có thể điều hướng tới vị trí không như mong đợi tùy route hiện tại lúc logout.
