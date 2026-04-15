import {
  adminPermissionSet,
  doctorPermissionSet,
  permissions,
} from "@/config/permissions";
import type {
  DashboardPayload,
  PermissionGroup,
  RolePermissionMatrix,
  UserProfile,
} from "@/types/app";

export const mockProfiles: Record<"doctor" | "admin", UserProfile> = {
  doctor: {
    id: 9,
    displayName: "Dr. Nguyen Thanh Truc",
    email: "truc.nguyen@medihub.vn",
    avatar:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=240&q=80",
    department: "Nội tổng quát",
    title: "Doctor Console",
    roleCodes: ["doctor"],
    permissions: doctorPermissionSet,
  },
  admin: {
    id: 1,
    displayName: "Hoang Minh Anh",
    email: "admin@medihub.vn",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
    department: "Platform Operations",
    title: "System Admin",
    roleCodes: ["admin"],
    permissions: adminPermissionSet,
  },
};

export const dashboards: Record<"doctor" | "admin", DashboardPayload> = {
  doctor: {
    heroTitle: "Clinical flow without clutter",
    heroDescription:
      "Theo dõi khung giờ khám, lịch hẹn, tin nhắn bệnh nhân và hồ sơ lâm sàng trong một workspace dành riêng cho bác sĩ.",
    metrics: [
      { label: "Ca khám hôm nay", value: "14", delta: "+3 vs hôm qua", tone: "success" },
      { label: "Tin nhắn chưa đọc", value: "8", delta: "2 cuộc hội thoại ưu tiên", tone: "warning" },
      { label: "Bệnh án mới nhận", value: "5", delta: "3 ảnh, 2 PDF", tone: "info" },
      { label: "Bài viết đang chờ duyệt", value: "4", delta: "1 draft cần cập nhật", tone: "default" },
    ],
    focusCards: [
      { label: "Tỉ lệ kín lịch", value: "86%", hint: "Giờ cao điểm 09:00 - 11:00" },
      { label: "Thời gian phản hồi TB", value: "12m", hint: "Kênh chat bệnh nhân" },
      { label: "Ca follow-up", value: "7", hint: "Sau điều trị trong 72h" },
    ],
    activity: [
      {
        id: "da1",
        title: "Bệnh nhân Trần Minh Khoa gửi MRI mới",
        description: "2 ảnh + 1 PDF đã vào hộp tóm tắt bệnh án.",
        time: "08:45",
        tone: "info",
      },
      {
        id: "da2",
        title: "Lịch khám 10:30 được dời sang 11:00",
        description: "Appointment #APT-2026-1048",
        time: "09:02",
        tone: "warning",
      },
      {
        id: "da3",
        title: "Bài viết “Chăm sóc sau nội soi” đã xuất bản",
        description: "Topic: Nội soi tiêu hóa",
        time: "09:30",
        tone: "success",
      },
    ],
    schedule: [
      { id: "ds1", title: "Khám follow-up | Lê Thanh Hà", time: "10:00 - 10:30", status: "Confirmed", accent: "bg-emerald-500" },
      { id: "ds2", title: "Tư vấn kết quả xét nghiệm | Nguyễn Đức Anh", time: "11:00 - 11:20", status: "Check files", accent: "bg-sky-500" },
      { id: "ds3", title: "Khám mới | Bùi Hương Ly", time: "14:00 - 14:40", status: "Needs triage", accent: "bg-amber-500" },
    ],
  },
  admin: {
    heroTitle: "Control tower for healthcare operations",
    heroDescription:
      "Giám sát người dùng, phân quyền, nội dung, lịch hẹn và tín hiệu hệ thống từ một dashboard quản trị nhiều role.",
    metrics: [
      { label: "Tổng người dùng", value: "12.4k", delta: "+214 tuần này", tone: "success" },
      { label: "Bác sĩ hoạt động", value: "168", delta: "12 chuyên khoa", tone: "info" },
      { label: "Lịch hẹn hôm nay", value: "482", delta: "17 ca dời lịch", tone: "warning" },
      { label: "Sự kiện audit mới", value: "91", delta: "5 cảnh báo mức cao", tone: "danger" },
    ],
    focusCards: [
      { label: "Đánh giá trung bình", value: "4.8/5", hint: "Từ 1.247 phản hồi" },
      { label: "Thông báo đang hoạt động", value: "12", hint: "4 chiến dịch theo phân khúc" },
      { label: "Khiếu nại chờ xử lý", value: "9", hint: "2 yêu cầu escalated" },
    ],
    activity: [
      {
        id: "aa1",
        title: "Role “content_moderator” vừa được gán 6 quyền mới",
        description: "Nguồn: module role-permission",
        time: "08:15",
        tone: "info",
      },
      {
        id: "aa2",
        title: "Audit log cảnh báo truy cập bất thường",
        description: "IP mới đăng nhập vào admin panel",
        time: "08:36",
        tone: "danger",
      },
      {
        id: "aa3",
        title: "Thông báo nhắc lịch khám đã gửi đến 320 bệnh nhân",
        description: "Campaign: remind-appt-morning",
        time: "09:10",
        tone: "success",
      },
    ],
    schedule: [
      { id: "as1", title: "Ops review | Appointment throughput", time: "10:00", status: "Live", accent: "bg-primary" },
      { id: "as2", title: "Moderation sync | Complaints & feedback", time: "13:30", status: "Pending", accent: "bg-amber-500" },
      { id: "as3", title: "Security digest | Audit anomalies", time: "16:00", status: "Priority", accent: "bg-rose-500" },
    ],
  },
};

export const permissionGroups: PermissionGroup[] = [
  {
    id: "doctor-space",
    label: "Doctor workspace",
    permissions: [
      { code: permissions.doctorDashboard, label: "Doctor dashboard", description: "Xem tổng quan công việc bác sĩ" },
      { code: permissions.doctorSchedules, label: "Manage schedules", description: "Quản lý doctor schedule" },
      { code: permissions.doctorAppointments, label: "Manage own appointments", description: "Quản lý lịch khám cá nhân" },
      { code: permissions.doctorMessages, label: "Manage patient messages", description: "Nhận và phản hồi tin nhắn bệnh nhân" },
      { code: permissions.patientRecords, label: "Manage patient records", description: "Xem ảnh/PDF bệnh án tổng hợp" },
      { code: permissions.patients, label: "Manage patients", description: "Xem danh sách và risk flags bệnh nhân" },
    ],
  },
  {
    id: "content-space",
    label: "Content workspace",
    permissions: [
      { code: permissions.tags, label: "Manage tags", description: "Tạo và chuẩn hóa tag" },
      { code: permissions.topics, label: "Manage topics", description: "Tạo chuyên đề nội dung" },
      { code: permissions.articles, label: "Manage articles", description: "Soạn, duyệt và xuất bản bài viết" },
    ],
  },
  {
    id: "admin-space",
    label: "Admin operations",
    permissions: [
      { code: permissions.adminDashboard, label: "Admin dashboard", description: "Xem control tower tổng" },
      { code: permissions.users, label: "Manage users", description: "Quản trị người dùng" },
      { code: permissions.adminPatients, label: "Manage patients", description: "Quản trị danh sách bệnh nhân ở góc nhìn admin" },
      { code: permissions.doctors, label: "Manage doctors", description: "Quản trị hồ sơ bác sĩ" },
      { code: permissions.appointments, label: "Manage appointments", description: "Điều phối lịch hẹn hệ thống" },
      { code: permissions.rolePermissions, label: "Manage role permissions", description: "Gán quyền và role matrix" },
      { code: permissions.ratings, label: "Manage ratings", description: "Kiểm soát đánh giá bệnh nhân" },
      { code: permissions.examResults, label: "Manage examination results", description: "Quản lý kết quả khám" },
      { code: permissions.relatives, label: "Manage relatives", description: "Quản lý liên kết người thân" },
      { code: permissions.auditLogs, label: "Manage audit logs", description: "Xem hành vi hệ thống" },
      { code: permissions.healthProfiles, label: "Manage health profiles", description: "Kiểm soát hồ sơ sức khỏe" },
      { code: permissions.relationships, label: "Manage relationships", description: "Quản trị danh mục quan hệ" },
      { code: permissions.specialties, label: "Manage specialties", description: "Quản trị chuyên khoa" },
      { code: permissions.complaints, label: "Manage complaints", description: "Xử lý phản hồi và khiếu nại" },
      { code: permissions.notifications, label: "Manage notifications", description: "Quản trị campaign thông báo" },
      { code: permissions.settings, label: "Manage settings", description: "Thiết lập hệ thống" },
    ],
  },
];

export const rolePermissionMatrix: RolePermissionMatrix[] = [
  { role: "doctor", label: "Doctor", grants: doctorPermissionSet },
  { role: "admin", label: "Admin", grants: adminPermissionSet },
];
