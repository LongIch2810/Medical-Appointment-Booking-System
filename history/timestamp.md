# Changelog - Permission Guard & Ownership Check

## 2026-05-27

### 1. Thêm `PermissionsGuard` cho tất cả controller (RBAC)

**Lý do:** Chỉ người có quyền mới được gọi API tương ứng.

**Đã thực hiện:**
- Thêm `@UseGuards(JwtAuthGuard, PermissionsGuard)` class-level hoặc method-level cho **25 controller**.
- Gắn `@Permissions(PERMISSIONS.XXX_YYY)` trên từng endpoint với quyền cụ thể (create/read/update/delete/manage/...).
- Đã sử dụng các hằng số `PERMISSIONS` từ `backend/src/utils/constants.ts` được khai báo sẵn.

**Danh sách file đã sửa:**
- `dashboard.controller.ts`
- `appointments.controller.ts`
- `role-permission.controller.ts`
- `audit-logs.controller.ts`
- `users.controller.ts`
- `roles.controller.ts`
- `permissions.controller.ts`
- `doctors.controller.ts`
- `specialties.controller.ts`
- `relationships.controller.ts`
- `topics.controller.ts`
- `tags.controller.ts`
- `articles.controller.ts`
- `relatives.controller.ts`
- `health-profile.controller.ts`
- `examination-result.controller.ts`
- `satisfaction-rating.controller.ts`
- `doctor-schedules.controller.ts`
- `notifications.controller.ts`
- `complaints.controller.ts`
- `messages.controller.ts`
- `channels.controller.ts`
- `chat-history.controller.ts`
- `uploads.controller.ts`
- `auth.controller.ts` (endpoint logout/logout-all)

### 2. Global `RolePermissionModule`

**Lý do:** `PermissionsGuard` inject `RolePermissionService`. Guard được dùng ở nhiều module khác nhau, cần service là global để tránh import lặp.

**File:** `backend/src/modules/role-permission/role-permission.module.ts`
- Thêm decorator `@Global()` lên module.

### 3. Thêm ownership check cho API tạo kết quả khám

**Lý do:** API tạo kết quả khám trước đây chỉ check appointment COMPLETED, không check appointment đó có thuộc bác sĩ đang đăng nhập hay không.

**Các file đã sửa:**

**a)** `backend/src/modules/appointments/appointments.service.ts`
- Thêm method `isAppointmentCompletedAndOwnedByDoctorUser(doctorUserId, appointmentId)`.
- Check: appointment COMPLETED `AND` `doctor_schedule.doctor.user.id === doctorUserId`.

**b)** `backend/src/modules/examination-result/examination-result.controller.ts`
- Thêm `@Request() req`, lấy `userId` từ `req.user` và truyền xuống service.

**c)** `backend/src/modules/examination-result/examination-result.service.ts`
- `create(userId, body)` thay vì `create(body)`.
- Gọi `isAppointmentCompletedAndOwnedByDoctorUser` thay vì `isAppointmentCompletedById`.

### Luồng bảo mật tổng thể

| API | RBAC (PermissionsGuard) | Ownership (business logic) |
|-----|------------------------|---------------------------|
| `POST /examination-result/create` | `examination-result:create` | appointment COMPLETED + thuộc bác sĩ đang login |
| `POST /satisfaction-rating/create-rating` | `satisfaction-rating:create` | appointment COMPLETED + có kết quả khám + thuộc patient đang login (đã có từ trước) |

### Build verification
- `npx nest build --builder swc` → `TSC Found 0 issues`, compile 283 files thành công.

---

## 2026-05-27 (phiên 2) - Fix `/api/v1/users/info` refresh error

**Lỗi:** Đăng nhập lấy thông tin user thành công, refresh trang thì bị redirect về `/sign-in`.

**Root cause:** `RouteProtected` đọc `userInfo` từ Zustand ngay lập tức khi render. Nếu store persist chưa hydrate kịp hoặc state không có user (vì persist lưu null sau logout), route redirect về `/sign-in` trước khi app kịp gọi `/users/info` bằng cookie httpOnly.

**Các file đã sửa:**

### a) `frontend/src/routes/RouteProtected.tsx`
- Thêm chờ Zustand persist hydrate xong trước khi quyết định redirect.
- Tự gọi `useProfile()` để request lại `/api/v1/users/info` sau reload.
- Nếu request thành công thì cập nhật lại `userInfo` vào store.
- Chỉ redirect `/sign-in` khi đã hydrate và request profile không có user.
- Thêm loading state trả về `null` trong lúc chờ hydrate/fetch.

### b) `frontend/src/api/userApi.ts`
- Thêm type `UserInfoResponse` cho response của `/users/info`.
- Generic axios call: `axiosInstance.get<UserInfoResponse>("/users/info")`.

### Build verification
- `npm run build` → không còn lỗi TypeScript từ thay đổi mới.
- Các lỗi TypeScript tồn tại sẵn (unused imports, prop type sai) không liên quan đến thay đổi này.

---

## 2026-05-27 (phien 3) - Cap nhat lon trong conversation

### Backend

#### 1. Fix circular import DTO appointment vs examination-result
- File: backend/src/modules/examination-result/dto/response/examinationResultResponse.dto.ts
- Thay AppointmentResponseDto bang ExaminationResultAppointmentResponseDto noi bo trong cung file de tranh vong import gay loi runtime "Cannot access 'AppointmentResponseDto' before initialization".

#### 2. Update status appointment co rang buoc thoi gian va trang thai
- File: backend/src/modules/appointments/appointments.service.ts (updateStatus, helper buildAppointmentStartDate).
- COMPLETED: phai la CONFIRMED, da den ngay + qua gio bat dau cua doctor_schedule, khong duoc CANCELLED/ABSENT.
- ABSENT: phai la CONFIRMED, da den ngay + qua gio bat dau, khong duoc CANCELLED/COMPLETED.
- Message lich chua tham xong rut gon: "Lich hen chua duoc kham xong".

#### 3. Service tao appointment cho admin dat ho
- File: backend/src/modules/appointments/appointments.service.ts (create).
- Detect role ADMIN qua user.roles[].role.role_name.
- Khi la admin, bo dieu kien relative.user.id = userId de dat ho moi relative.

#### 4. Filter bai viet dung is_approve linh hoat
- File: backend/src/modules/articles/dto/request/bodyFilterArticles.dto.ts: them is_approve enum 'true' | 'false' | 'all', normalize boolean/string.
- File: backend/src/modules/articles/dto/request/bodyFilterArticlesImprove.dto.ts: doi tu IsBoolean -> IsIn cung gia tri.
- File: backend/src/modules/articles/articles.service.ts: filterAndPagination & filterAndPaginationByDoctors khong con hard-code is_approve = true. Default tra bai approved khi khong truyen, true / false / all hoat dong tuong ung.

#### 5. Migration grant appointment:create cho ADMIN
- File moi: backend/src/database/migrations/1779800000000-grantAdminAppointmentCreate.ts. Insert role_permissions cho ADMIN voi appointment:create neu chua co.

### Admin frontend

#### 6. Toast cap nhat trang thai appointment chi tiet hon
- File: admin/src/hooks/useAppointments.ts. Them APPOINTMENT_STATUS_LABEL, parser readApiErrorMessage. Toast theo tung trang thai. Loi COMPLETED dung message "Lich hen chua duoc kham xong" lam fallback.

#### 7. UI module Complaint dep hon
- File: admin/src/pages/GenericModulePage.tsx. Them COMPLAINT_STATUS_META + ComplaintStatusBadge co icon. Them khoi 4 stats theo trang thai. Filter card border + bg-white. Bang list dung cot Tieu de & noi dung, Nguoi gui voi avatar + email, Thoi gian gui, action co icon Tiep nhan / Hoan tat. DetailDialog co khoi soan phan hoi sky cho in_progress, khoi phan hoi accent emerald.

#### 8. UI module Article: filter approval + showing all
- File: admin/src/pages/GenericModulePage.tsx ArticlesModule. Them tab All / Da duyet / Cho duyet.
- File: admin/src/types/interface/article.interface.ts. ArticleListPayload them is_approve.

#### 9. Nut Vang mat & sua hover Vang mat
- File: admin/src/pages/GenericModulePage.tsx. Them nut Vang mat trong cot Thao tac AppointmentsModule chi hien khi appointment_status === CONFIRMED. Style amber outline. ConfirmDialog co note rang buoc thoi gian. Doi hover sang amber-100 + amber-800 thay vi mac dinh.

#### 10. Modal dat lich moi cho admin
- File: admin/src/pages/GenericModulePage.tsx. Them AppointmentCreateDialog: chon Bac si, Ca kham, Ngay, Benh nhan. Chuyen sang component SearchableSelect: nut trigger giong select, click mo panel co thanh tim kiem, danh sach voi icon Check, phan trang Truoc/Sau, dong khi click ngoai/Escape, autofocus search.
- Bac si va benh nhan goi backend co page/limit/search 10/page. Ca kham flatten + filter client + phan trang client.
- Helper imports: useEffect, useRef tu react; Check, ChevronDown tu lucide-react.

### Frontend (patient)

#### 11. UI Visit Results dep hon
- File: frontend/src/pages/patient/VisitResults.tsx. Header gradient, badge tong, search box loc client, skeleton loading, card moi ket qua co icon doctor + 4 muc Trieu chung / Chan doan / Huong dieu tri / Don thuoc voi accent rieng. Dialog chi tiet co khoi info + 4 section.

#### 12. Trang Complaints (patient)
- File: frontend/src/pages/patient/Complaints.tsx. Them dialog Gui gop y moi dung useComplaint. Header gradient + 4 stats theo trang thai. Filter pill voi badge so luong. Card kho hop voi icon trang thai, badge Da co phan hoi. Dialog chi tiet co khoi noi dung slate, khoi phan hoi emerald hoac empty card khi chua co.
- File: frontend/src/hooks/useComplaint.tsx. Them invalidate ['my-complaints'] khi tao thanh cong.

#### 13. Trang Doctor co nut Reset bo loc
- File: frontend/src/pages/Doctor.tsx. Them nut RotateCcw "Dat lai bo loc". Reset store filter + URL params. Style outline trung tinh hover primary.

### History
- File: history/timestamp.md. Ghi changelog phien 3 nay.
