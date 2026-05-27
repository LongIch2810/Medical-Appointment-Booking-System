# Lịch sử thay đổi (Conversation Log)

**Ngày:** 2026-05-27

---

## Tổng quan mục tiêu
Tích hợp, sửa lỗi và nâng cấp admin dashboard cùng các API backend cho hệ thống đặt lịch khám bệnh.

---

## Các thay đổi đã thực hiện

### 1. Axios Interceptor – Xử lý Refresh Token
- **File:** `admin/src/configs/axios.ts`
- Viết lại hoàn toàn response interceptor:
  - Dùng `refreshPromise` (shared promise) để gộp các request 401 đồng thời → chỉ gọi `/auth/refresh` một lần
  - `_retryCount` cho phép retry đúng 1 lần sau refresh thành công
  - Lỗi network/5xx khi refresh → giữ nguyên session, không logout
  - Lỗi 401/403 khi refresh → logout ngay
- Tách `refreshInstance` (plain axios, không có interceptor) dùng riêng cho `authApi.ts`

### 2. Auth API
- **File:** `admin/src/api/authApi.ts`
- `refresh`, `logout`, `logoutAll` chuyển sang dùng `refreshInstance` để tránh đệ quy interceptor

### 3. Hook useCurrentDoctor
- **File:** `admin/src/hooks/useCurrentDoctor.ts`
- Hook mới: fetch `doctor_id` bằng cách gọi `POST /doctors` rồi filter theo `user_id`

### 4. Hook useAuth
- **File:** `admin/src/hooks/useAuth.ts`
- Pass `currentRole` vào `getFirstAccessiblePath` để redirect đúng dashboard theo role

### 5. AppRoutes
- **File:** `admin/src/AppRoutes.tsx`
- Cập nhật router để gọi `getFirstAccessiblePath` với role tương ứng (admin/doctor)

### 6. Admin Dashboard
- **File:** `admin/src/pages/AdminDashboardPage.tsx`
- Tích hợp biểu đồ SVG:
  - `DonutChart` – phân bố trạng thái lịch hẹn
  - `MetricBarChart` – số bệnh nhân, lịch hẹn, bác sĩ
  - Progress bar – tỷ lệ hủy lịch

### 7. Doctor Dashboard
- **File:** `admin/src/pages/DoctorDashboardPage.tsx`
- Tích hợp biểu đồ:
  - `MetricBarChart` – khối lượng công việc (hôm nay, tuần này, tháng này)
  - `SegmentedStatusBar` – trạng thái lịch hẹn theo segment màu
  - Timeline dots – lịch hẹn sắp tới
- Wrap `fetchDoctorDashboard` – bắt lỗi 404 trả về `DoctorDashboard` rỗng

### 8. GenericModulePage
- **File:** `admin/src/pages/GenericModulePage.tsx`
- Permission-gated CUD buttons (dùng action-level permissions như `tag:create` hoặc `*:manage`)
- Day-picker cho doctor schedules
- Nút detail view ở mọi module
- Form dialog cho create/edit
- Confirm dialog cho delete

### 9. Shared UI Components (mới)
- **File:** `admin/src/components/app/GenericList.tsx`
  - Component danh sách dùng chung với phân trang, search, sắp xếp
- **File:** `admin/src/components/app/Pagination.tsx`
  - Phân trang với first/last/page-number buttons
- **File:** `admin/src/components/app/FormDialog.tsx`
  - Dialog tạo/sửa dùng chung
- **File:** `admin/src/components/app/ConfirmDialog.tsx`
  - Dialog xác nhận xóa
- **File:** `admin/src/components/app/DetailDialog.tsx`
  - Dialog hiển thị chi tiết dạng grid
- **File:** `admin/src/components/app/DonutChart.tsx`
  - Biểu đồ donut SVG (zero dependency)
- **File:** `admin/src/components/app/MetricBarChart.tsx`
  - Thanh metric với icon + nhãn (zero dependency)
- **File:** `admin/src/components/app/SegmentedStatusBar.tsx`
  - Thanh trạng thái nhiều segment màu (zero dependency)

### 10. Permission Helper
- **File:** `admin/src/lib/navigation.ts`
  - `hasAnyPermission` – kiểm tra quyền linh hoạt
- **File:** `admin/src/hooks/usePermission.ts`
  - Hook `usePermission` – gọi lên store

### 11. Backend – HTTP Status Codes
- **Các file controller:** Thêm `@HttpCode(...)` vào mọi endpoint
  - `POST` → `201 Created`
  - `GET` → `200 OK`
  - `PUT/PATCH` → `200 OK` (hoặc `202 Accepted` nếu async)
  - `DELETE` → `200 OK` (hoặc `202 Accepted` / `204 No Content`)

### 12. Types – relationship_name
- **File:** `admin/src/types/interface/relationship.interface.ts`
  - Thêm trường `relationship_name` khớp với backend
  - Giữ alias `name` để tương thích ngược
- **File:** `admin/src/types/interface/relative.interface.ts`
  - Cập nhật tương tự

### 13. Sửa lỗi – Doctor Dashboard 404
- Backend `/dashboard/doctor` trả về 404 khi không có lịch hôm nay
- Workaround: `fetchDoctorDashboard` bắt 404 → trả về object rỗng

### 14. Sửa lỗi – findByUserId thiếu relation `doctor`
- Backend `findByUserId` không load relation `doctor`
- Workaround: `useCurrentDoctor` gọi `POST /doctors` để lấy doctorId, dùng admin endpoint để lấy appointments

### 15. Sửa lỗi – filterAndPaginationPatients thiếu roleCondition
- Backend bỏ qua `roleCondition` khi search rỗng
- Cần backend fix

---

## Ghi chú kỹ thuật
- **Refresh token flow:** Shared promise (`refreshPromise`) thay vì `isRefreshing` flag + manual queue → tránh race condition
- **Retry policy:** Mỗi request retry tối đa 1 lần sau refresh thành công; nếu retry vẫn 401 → logout
- **Charts:** Dùng SVG/CSS thuần, không thêm dependency chart library
- **Auth store:** Có version mismatch (v0 → v2) có thể xóa session khi reload; cần migrate sau
- **Zuistand persist:** `useAuthStore` dùng persist middleware; subscribe để reset `isHandlingExpired` khi user login

---

## Các tác vụ còn lại (Next Steps)
1. Kiểm tra cookie `/auth/admin/login` có `path=/` và `sameSite=lax` để browser gửi được khi reload
2. Xác nhận backend `findByUserId` load relation `doctor` để khôi phục `useDoctorAppointments`
3. Test full flow: login → reload → auto refresh → `/users/info` thành công
4. Migrate auth store persist version từ v0 → v2 để tránh mất session khi reload
