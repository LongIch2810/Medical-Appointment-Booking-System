import type { ModuleConfig } from "@/types/app";

const attachmentImage =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80";
const attachmentPdf =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

function buildModule(config: ModuleConfig): ModuleConfig {
  return config;
}

export const doctorModuleConfigs: Record<string, ModuleConfig> = {
  "doctor-schedules": buildModule({
    id: "doctor-schedules",
    title: "Quản lý khung giờ khám",
    description: "Thiết kế slot khám, trạng thái mở/khóa và năng lực tiếp nhận theo từng ca.",
    searchPlaceholder: "Tìm khung giờ, phòng khám hoặc trạng thái...",
    statusLabel: "Doctor module",
    metrics: [
      { label: "Slot mở", value: "38", delta: "6 slot mới tuần này" },
      { label: "Slot kín", value: "24", delta: "Tỉ lệ lấp đầy 63%", tone: "success" },
      { label: "Slot blocked", value: "4", delta: "2 slot bảo trì phòng", tone: "warning" },
    ],
    columns: [
      { key: "slot", label: "Khung giờ" },
      { key: "room", label: "Phòng" },
      { key: "capacity", label: "Năng lực" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "sc1",
        cells: {
          slot: { label: "08:00 - 08:30", sublabel: "Thứ 2, 06/04" },
          room: "P. Nội tổng quát A2",
          capacity: "6 bệnh nhân",
          status: { label: "Open", tone: "success" },
        },
        summary: "Ca đầu ngày, ưu tiên khám follow-up và tái kê đơn.",
        meta: [
          { label: "Bác sĩ", value: "Dr. Truc" },
          { label: "Loại lịch", value: "Sáng chuẩn" },
        ],
      },
      {
        id: "sc2",
        cells: {
          slot: { label: "10:30 - 11:30", sublabel: "Thứ 2, 06/04" },
          room: "P. Nội tổng quát A1",
          capacity: "4 bệnh nhân",
          status: { label: "Busy", tone: "warning" },
        },
        summary: "Khung giờ sát cao điểm, đã được bệnh nhân đặt nhiều.",
        meta: [
          { label: "Dự phòng", value: "1 slot" },
          { label: "Nhắc lịch", value: "Đã bật" },
        ],
      },
      {
        id: "sc3",
        cells: {
          slot: { label: "15:00 - 16:00", sublabel: "Thứ 3, 07/04" },
          room: "P. Nội tổng quát B1",
          capacity: "0 bệnh nhân",
          status: { label: "Blocked", tone: "danger" },
        },
        summary: "Khóa do phòng đang nâng cấp thiết bị đo sinh hiệu.",
        meta: [
          { label: "Lý do", value: "Bảo trì thiết bị" },
          { label: "Người khóa", value: "Ops admin" },
        ],
      },
    ],
    quickActions: ["Tạo slot mới", "Khóa ca", "Nhân bản lịch tuần"],
    emptyTitle: "Chưa có khung giờ phù hợp",
    emptyDescription: "Điều chỉnh bộ lọc hoặc tạo nhanh một lịch khám mới.",
    backendModule: "doctor-schedules",
    integrationNote: "API doctor-schedules đã có backend module; UI hiện dùng mock filtering và mock action.",
  }),
  "doctor-appointments": buildModule({
    id: "doctor-appointments",
    title: "Quản lý lịch khám bác sĩ",
    description: "Theo dõi lịch hẹn cá nhân, tình trạng check-in và yêu cầu đổi lịch.",
    searchPlaceholder: "Tìm theo mã lịch, bệnh nhân, trạng thái...",
    statusLabel: "Doctor module",
    metrics: [
      { label: "Lịch hôm nay", value: "14", delta: "11 đã xác nhận", tone: "success" },
      { label: "Yêu cầu đổi lịch", value: "3", delta: "1 ca cần phản hồi", tone: "warning" },
      { label: "No-show", value: "1", delta: "Giảm 2 ca so tuần trước" },
    ],
    columns: [
      { key: "patient", label: "Bệnh nhân" },
      { key: "time", label: "Thời gian" },
      { key: "reason", label: "Lý do khám" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "ap1",
        cells: {
          patient: { label: "Lê Thanh Hà", sublabel: "APT-2026-1048" },
          time: "10:00 - 10:30",
          reason: "Tái khám sau điều trị viêm dạ dày",
          status: { label: "Confirmed", tone: "success" },
        },
        summary: "Bệnh nhân đã gửi đủ kết quả xét nghiệm và biểu mẫu tiền sử.",
        meta: [
          { label: "Điểm ưu tiên", value: "Chuẩn" },
          { label: "Kênh đặt", value: "Patient portal" },
        ],
      },
      {
        id: "ap2",
        cells: {
          patient: { label: "Nguyễn Đức Anh", sublabel: "APT-2026-1052" },
          time: "11:00 - 11:20",
          reason: "Đọc kết quả xét nghiệm men gan",
          status: { label: "Waiting files", tone: "warning" },
        },
        summary: "Cần tải thêm file siêu âm gan trước buổi khám.",
        meta: [
          { label: "Nhắc bệnh nhân", value: "Đã gửi 09:00" },
          { label: "Mức rủi ro", value: "Trung bình" },
        ],
      },
      {
        id: "ap3",
        cells: {
          patient: { label: "Bùi Hương Ly", sublabel: "APT-2026-1074" },
          time: "14:00 - 14:40",
          reason: "Khám mới đau bụng kéo dài",
          status: { label: "Needs triage", tone: "info" },
        },
        summary: "Patient intake có ghi nhận đau tăng sau ăn.",
        meta: [
          { label: "Điểm ưu tiên", value: "High" },
          { label: "Số file đính kèm", value: "2" },
        ],
      },
    ],
    quickActions: ["Xem ca kế tiếp", "Gửi nhắc lịch", "Đánh dấu đã khám"],
    emptyTitle: "Không có lịch hẹn nào",
    emptyDescription: "Hiện không có lịch hẹn khớp với bộ lọc đã chọn.",
    backendModule: "appointments",
    integrationNote: "Backend appointments đã có module; UI đang mock reschedule, check-in và trạng thái.",
  }),
  "patient-records": buildModule({
    id: "patient-records",
    title: "Tóm tắt bệnh án bệnh nhân",
    description: "Tổng hợp ảnh, PDF và metadata bệnh án để bác sĩ xem nhanh trước ca khám.",
    searchPlaceholder: "Tìm theo bệnh nhân, loại tài liệu, trạng thái...",
    statusLabel: "Doctor records module",
    metrics: [
      { label: "Hồ sơ mới nhận", value: "5", delta: "3 ảnh, 2 PDF", tone: "info" },
      { label: "Cần review", value: "2", delta: "Có cảnh báo thiếu metadata", tone: "warning" },
      { label: "Đã tóm tắt", value: "19", delta: "Tăng 6 hồ sơ/tuần", tone: "success" },
    ],
    columns: [
      { key: "patient", label: "Bệnh nhân" },
      { key: "document", label: "Tài liệu" },
      { key: "createdAt", label: "Ngày nhận" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "pr1",
        cells: {
          patient: { label: "Trần Minh Khoa", sublabel: "Nam, 42 tuổi" },
          document: "MRI bụng + báo cáo PDF",
          createdAt: "03/04/2026 08:42",
          status: { label: "Ready to review", tone: "info" },
        },
        summary: "Bệnh nhân gửi MRI và báo cáo từ cơ sở bên ngoài, cần đọc trước lịch 15:00.",
        meta: [
          { label: "Bác sĩ phụ trách", value: "Dr. Truc" },
          { label: "Loại hồ sơ", value: "Imaging + report" },
        ],
        attachments: [
          { id: "a1", name: "mri-abdomen.jpg", type: "image", url: attachmentImage },
          { id: "a2", name: "report.pdf", type: "pdf", url: attachmentPdf },
        ],
      },
      {
        id: "pr2",
        cells: {
          patient: { label: "Nguyễn Thu An", sublabel: "Nữ, 35 tuổi" },
          document: "Kết quả xét nghiệm máu",
          createdAt: "02/04/2026 18:20",
          status: { label: "Missing note", tone: "warning" },
        },
        summary: "Thiếu thông tin đơn vị xét nghiệm và ghi chú triệu chứng đi kèm.",
        meta: [
          { label: "Uploader", value: "Patient portal" },
          { label: "Số file", value: "1 PDF" },
        ],
        attachments: [{ id: "a3", name: "lab-summary.pdf", type: "pdf", url: attachmentPdf }],
      },
    ],
    quickActions: ["Tải lên hồ sơ", "Xem hồ sơ mới", "Xuất tóm tắt"],
    emptyTitle: "Chưa có bệnh án nào",
    emptyDescription: "Khi bệnh nhân gửi ảnh hoặc PDF, hồ sơ sẽ xuất hiện tại đây.",
    backendModule: "health-profile / examination-result / uploads",
    integrationNote: "Backend có health-profile, examination-result và uploads; cần API aggregate để gom hồ sơ thành workbench cho doctor.",
  }),
  patients: buildModule({
    id: "patients",
    title: "Quản lý bệnh nhân",
    description: "Theo dõi danh sách bệnh nhân, risk flag và lịch sử tương tác gần nhất.",
    searchPlaceholder: "Tìm bệnh nhân, số điện thoại, hồ sơ sức khỏe...",
    statusLabel: "Doctor module",
    metrics: [
      { label: "Bệnh nhân active", value: "126", delta: "28 ca follow-up tháng này" },
      { label: "Risk flag cao", value: "7", delta: "3 ca cần phản hồi gấp", tone: "warning" },
      { label: "Có hồ sơ đầy đủ", value: "82%", delta: "Tăng 6% sau chiến dịch" },
    ],
    columns: [
      { key: "patient", label: "Bệnh nhân" },
      { key: "history", label: "Lần tương tác gần nhất" },
      { key: "condition", label: "Nhóm bệnh" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "pt1",
        cells: {
          patient: { label: "Lê Thanh Hà", sublabel: "BN-29481" },
          history: "Tái khám 01/04/2026",
          condition: "Viêm dạ dày mạn",
          status: { label: "Stable", tone: "success" },
        },
        summary: "Đã hoàn tất điều trị 14 ngày, chuẩn bị follow-up 1 tháng.",
        meta: [
          { label: "Phone", value: "0909 233 112" },
          { label: "Người thân", value: "1 hồ sơ liên kết" },
        ],
      },
      {
        id: "pt2",
        cells: {
          patient: { label: "Bùi Hương Ly", sublabel: "BN-30214" },
          history: "Chat triage 03/04/2026",
          condition: "Đau bụng chưa rõ nguyên nhân",
          status: { label: "Monitor", tone: "warning" },
        },
        summary: "Mới tiếp nhận, cần hoàn thiện health profile trước buổi khám.",
        meta: [
          { label: "Nguồn", value: "Patient portal" },
          { label: "Risk", value: "Medium" },
        ],
      },
    ],
    quickActions: ["Tạo hồ sơ bệnh nhân", "Xem follow-up", "Liên kết người thân"],
    emptyTitle: "Danh sách bệnh nhân đang trống",
    emptyDescription: "Bệnh nhân đã từng khám hoặc nhắn tin sẽ xuất hiện tại đây.",
    backendModule: "users / health-profile / relatives",
    integrationNote: "Backend có users, health-profile, relatives; patient segmentation đang mock.",
  }),
};
