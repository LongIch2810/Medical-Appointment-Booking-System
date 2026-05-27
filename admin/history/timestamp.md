# Changelog

> Ghi lại tất cả thay đổi trong conversation này.

## 2026-05-27

### Fixed: Refresh token thiếu roles (gây 403 sau refresh)

- **File:** `backend/src/modules/auth/auth.service.ts` (dòng 254-276)
- **File:** `backend/src/modules/auth/refresh.strategy.ts` (dòng 27-44)
- Thêm `roles` vào `newPayload` khi refresh token, tránh lỗi 403 ở `PermissionsGuard` sau page refresh.

### Added: Filter UI cho AppointmentsModule

- **File:** `admin/src/pages/GenericModulePage.tsx` — `AppointmentsModule`
- Filter theo trạng thái (`appointmentStatus`), ngày khám (`appointmentDate`), bác sĩ (`doctorId` cho admin).
- Nút "Xóa lọc" reset tất cả filter.
- Filter sync với `AdminAppointmentListPayload`.

### Added: DoctorSchedulesModule — Create / Edit

- **File:** `admin/src/pages/GenericModulePage.tsx` — `DoctorScheduleFormDialog`
- Form: ngày (`input type="date"`), giờ bắt đầu, giờ kết thúc.
- Nút "+ Thêm ca" trong toolbar, nút Sửa trong mỗi row.
- Dùng `useCreateDoctorSchedule` / `useUpdateDoctorSchedule`.

### Added: NotificationsModule — Create

- **File:** `admin/src/pages/GenericModulePage.tsx` — `NotificationCreateDialog`
- Form: title, content, userId.
- Nút "+ Thêm thông báo" trong toolbar.
- Dùng `useCreateNotification`.

### Added: SatisfactionRatingsModule — Edit

- **File:** `admin/src/pages/GenericModulePage.tsx` — `SatisfactionRatingEditDialog`
- Form: rating (1-5), comment.
- Nút Sửa trong mỗi row.
- Dùng `useUpdateSatisfactionRating`.

### Added: ExamResultsModule — Create / Edit / Delete

- **File:** `admin/src/pages/GenericModulePage.tsx` — `ExaminationResultFormDialog`
- Form: diagnosis, treatment, prescription, notes.
- Nút "+ Thêm kết quả" trong toolbar, Sửa / Xóa trong mỗi row.
- Delete dùng `ConfirmDialog`.
- Dùng `useCreateExaminationResult` / `useUpdateExaminationResult` / `useDeleteExaminationResult`.

### Added: RelativesModule — Create / Edit / Delete

- **File:** `admin/src/pages/GenericModulePage.tsx` — `RelativeFormDialog`
- Form: fullname, phone, date_of_birth, gender.
- Nút "+ Thêm người thân" trong toolbar, Sửa / Xóa trong mỗi row.
- Delete dùng `ConfirmDialog`.
- Dùng `useCreateRelative` / `useUpdateRelative` / `useDeleteRelative`.

### Added: ComplaintsModule — Create dialog + Filters

- **File:** `admin/src/pages/GenericModulePage.tsx` — `ComplaintCreateDialog`
- Form: title, description, optional userId.
- Filter: status dropdown, fromDate / toDate.
- Nút "+ Thêm khiếu nại" trong toolbar.
- Dùng `useCreateComplaint`.

### Added: MessagesPage — Tích hợp channels/messages từ backend

- **File:** `admin/src/config/permissions.ts` — thêm `permissions.doctorMessages` vào `adminPermissionSet`
- **File:** `admin/src/types/interface/channel.interface.ts` — mới
- **File:** `admin/src/types/interface/message.interface.ts` — mới
- **File:** `admin/src/api/channelApi.ts` — mới
- **File:** `admin/src/api/messageApi.ts` — mới
- **File:** `admin/src/hooks/useChannels.ts` — mới
- **File:** `admin/src/hooks/useMessages.ts` — mới
- **File:** `admin/src/pages/MessagesPage.tsx` — viết lại hoàn toàn
- UI chat 2 cột: danh sách hội thoại (trái) + khung chat (phải).
- Gửi tin nhắn qua backend, phân biệt tin của mình / của người khác.
- Dùng `useAuthStore` lấy `currentUser.id` làm `sender_id`.
- Menu Messages giờ admin cũng thấy (sidebar `/doctor/messages`).

### Fixed: RelationshipsModule — dùng `relationship_name` thay `name`

- **File:** `admin/src/pages/GenericModulePage.tsx` — `RelationshipFormDialog` + `RelationshipsModule`
- `RelationshipFormState.name` → `relationship_name`
- Mutation payload: `name` → `relationship_name` (khớp `CreateRelationshipPayload` / `UpdateRelationshipPayload`)
- Table column: render `row.relationship_name || row.name || row.relationship_code`
- Fix 2 lỗi TypeScript tồn đọng (`name` not in payload types).

### Removed: Code cleanup

- **File:** `admin/src/pages/GenericModulePage.tsx`
- Xóa unused `useCreateComplaint` import (sau đó thêm lại khi cần).
- Xóa unused `selectedDayLabel` variable.
- `DoctorScheduleFormDialog` — bỏ prop `selectedDay` không dùng.
