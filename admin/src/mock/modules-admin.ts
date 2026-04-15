import type { ModuleConfig } from "@/types/app";

const attachmentImage =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80";
const attachmentPdf =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

function buildModule(config: ModuleConfig): ModuleConfig {
  return config;
}

export const adminModuleConfigs: Record<string, ModuleConfig> = {
  users: buildModule({
    id: "users",
    title: "Quản lý người dùng",
    description: "Theo dõi tài khoản bệnh nhân và nhân sự, trạng thái xác thực và phân vai hiện tại.",
    searchPlaceholder: "Tìm user, email, số điện thoại...",
    statusLabel: "Admin module",
    metrics: [
      { label: "User mới 7 ngày", value: "214", delta: "18% từ chiến dịch referral", tone: "success" },
      { label: "Tài khoản bị khóa", value: "6", delta: "4 do nhập sai OTP", tone: "warning" },
      { label: "Đã xác thực", value: "91%", delta: "Email + phone" },
    ],
    columns: [
      { key: "user", label: "Người dùng" },
      { key: "role", label: "Vai trò" },
      { key: "lastSeen", label: "Lần hoạt động" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "us1",
        cells: {
          user: { label: "Nguyễn Hoài Nam", sublabel: "nam@gmail.com" },
          role: "Patient",
          lastSeen: "03/04/2026 09:12",
          status: { label: "Verified", tone: "success" },
        },
        summary: "Có 2 hồ sơ sức khỏe liên kết và 1 người thân.",
        meta: [
          { label: "Phone", value: "0901 889 112" },
          { label: "Source", value: "Organic" },
        ],
      },
      {
        id: "us2",
        cells: {
          user: { label: "Tran Duy Hung", sublabel: "hung.ops@medihub.vn" },
          role: "Staff",
          lastSeen: "03/04/2026 08:40",
          status: { label: "Review required", tone: "warning" },
        },
        summary: "Cần xác nhận lại vai trò sau thay đổi team nội bộ.",
        meta: [
          { label: "Role hiện tại", value: "support" },
          { label: "Access scope", value: "messages" },
        ],
      },
    ],
    quickActions: ["Tạo user", "Khóa tài khoản", "Xuất danh sách"],
    emptyTitle: "Không có người dùng nào",
    emptyDescription: "Dữ liệu user sẽ hiển thị sau khi backend users trả danh sách.",
    backendModule: "users",
    integrationNote: "Backend users đã có getUsers và user info; thiếu API admin filter/pagination/chỉnh role nên đang mock.",
  }),
  "admin-patients": buildModule({
    id: "admin-patients",
    title: "Quản lý bệnh nhân",
    description:
      "Theo dõi bệnh nhân ở góc nhìn vận hành: mức độ hoạt động, completeness hồ sơ, liên kết người thân và cờ rủi ro.",
    searchPlaceholder: "Tìm theo tên bệnh nhân, mã hồ sơ, số điện thoại...",
    statusLabel: "Admin module",
    metrics: [
      { label: "Bệnh nhân active", value: "8.9k", delta: "+186 tuần này", tone: "success" },
      { label: "Thiếu hồ sơ", value: "214", delta: "Cần nhắc bổ sung", tone: "warning" },
      { label: "Risk cao", value: "28", delta: "Cần review sớm", tone: "danger" },
    ],
    columns: [
      { key: "patient", label: "Bệnh nhân" },
      { key: "profile", label: "Hồ sơ" },
      { key: "engagement", label: "Mức độ hoạt động" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "ap-pt1",
        cells: {
          patient: { label: "Lê Thanh Hà", sublabel: "BN-29481 • 0909 233 112" },
          profile: "Đầy đủ hồ sơ + 1 người thân",
          engagement: "4 lịch khám trong 90 ngày",
          status: { label: "Healthy profile", tone: "success" },
        },
        summary:
          "Bệnh nhân có lịch sử khám đều, hồ sơ sức khỏe hoàn chỉnh và không có cảnh báo bảo hiểm/ủy quyền.",
        meta: [
          { label: "Health profile", value: "Complete" },
          { label: "Relatives", value: "1 linked profile" },
          { label: "Last appointment", value: "01/04/2026" },
        ],
      },
      {
        id: "ap-pt2",
        cells: {
          patient: { label: "Bùi Hương Ly", sublabel: "BN-30214 • 0918 552 881" },
          profile: "Thiếu dị ứng thuốc",
          engagement: "Mới tạo account 2 ngày trước",
          status: { label: "Needs completion", tone: "warning" },
        },
        summary:
          "Bệnh nhân mới, health profile chưa đầy đủ và đang chờ bác sĩ triage lần đầu.",
        meta: [
          { label: "Health profile", value: "Missing allergy data" },
          { label: "Relatives", value: "No linked relative" },
          { label: "Next action", value: "Send completion reminder" },
        ],
      },
      {
        id: "ap-pt3",
        cells: {
          patient: { label: "Trần Minh Khoa", sublabel: "BN-28740 • 0987 441 009" },
          profile: "Có hồ sơ ảnh/PDF ngoài hệ thống",
          engagement: "3 lượt upload hồ sơ trong tuần",
          status: { label: "High risk review", tone: "danger" },
        },
        summary:
          "Đang có nhiều tài liệu ngoại viện và cờ rủi ro cần admin/doctor theo dõi phối hợp.",
        meta: [
          { label: "Record source", value: "External imaging upload" },
          { label: "Risk level", value: "High" },
          { label: "Assigned doctor", value: "Dr. Truc" },
        ],
      },
    ],
    quickActions: ["Xem risk cao", "Nhắc hoàn thiện hồ sơ", "Xuất danh sách bệnh nhân"],
    emptyTitle: "Chưa có bệnh nhân nào",
    emptyDescription: "Danh sách bệnh nhân admin sẽ hiện khi có dữ liệu tổng hợp từ users + health profiles.",
    backendModule: "users / health-profile / relatives / appointments",
    integrationNote:
      "Backend hiện có users, health-profile, relatives, appointments; cần API aggregate/patient-admin-list để gom đúng góc nhìn vận hành.",
  }),
  doctors: buildModule({
    id: "doctors",
    title: "Quản lý bác sĩ",
    description: "Quản trị hồ sơ bác sĩ, chuyên khoa, trạng thái hoạt động và năng lực tiếp nhận.",
    searchPlaceholder: "Tìm theo tên bác sĩ, chuyên khoa, phòng khám...",
    statusLabel: "Admin module",
    metrics: [
      { label: "Bác sĩ active", value: "168", delta: "12 chuyên khoa" },
      { label: "Chờ xác minh hồ sơ", value: "7", delta: "3 thiếu chứng chỉ", tone: "warning" },
      { label: "Outstanding", value: "19", delta: "Dựa trên đánh giá + tải lịch", tone: "success" },
    ],
    columns: [
      { key: "doctor", label: "Bác sĩ" },
      { key: "specialty", label: "Chuyên khoa" },
      { key: "load", label: "Tải lịch" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "dc1",
        cells: {
          doctor: { label: "Dr. Nguyen Thanh Truc", sublabel: "ID# DOC-018" },
          specialty: "Nội tổng quát",
          load: "86% kín lịch tuần",
          status: { label: "Active", tone: "success" },
        },
        summary: "Tỉ lệ phản hồi bệnh nhân cao, nhiều bài viết chuyên môn.",
        meta: [
          { label: "Rating", value: "4.9" },
          { label: "Bài viết", value: "18" },
        ],
      },
      {
        id: "dc2",
        cells: {
          doctor: { label: "Dr. Le Quang Hai", sublabel: "ID# DOC-044" },
          specialty: "Gan mật",
          load: "44% kín lịch tuần",
          status: { label: "Credential pending", tone: "warning" },
        },
        summary: "Thiếu cập nhật chứng chỉ CME trong quý này.",
        meta: [
          { label: "Office", value: "Clinic B" },
          { label: "HR owner", value: "Mai Linh" },
        ],
      },
    ],
    quickActions: ["Tạo bác sĩ", "Gán chuyên khoa", "Xem hồ sơ outstanding"],
    emptyTitle: "Chưa có hồ sơ bác sĩ",
    emptyDescription: "Danh sách bác sĩ sẽ hiển thị khi có dữ liệu doctors từ backend.",
    backendModule: "doctors",
    integrationNote: "Backend doctors module có sẵn; admin doctor verification flow đang mock.",
  }),
  appointments: buildModule({
    id: "appointments",
    title: "Quản lý lịch hẹn khám",
    description: "Quan sát toàn hệ thống lịch hẹn, điều phối dời lịch và phát hiện bottleneck vận hành.",
    searchPlaceholder: "Tìm theo mã hẹn, bác sĩ, bệnh nhân, trạng thái...",
    statusLabel: "Admin module",
    metrics: [
      { label: "Lịch hôm nay", value: "482", delta: "Tăng 11% so cùng kỳ", tone: "success" },
      { label: "Dời lịch", value: "17", delta: "9 do doctor request", tone: "warning" },
      { label: "Hủy lịch", value: "6", delta: "Tỉ lệ 1.2%" },
    ],
    columns: [
      { key: "appointment", label: "Lịch hẹn" },
      { key: "doctor", label: "Bác sĩ" },
      { key: "time", label: "Khung giờ" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "ad1",
        cells: {
          appointment: { label: "APT-2026-1048", sublabel: "Lê Thanh Hà" },
          doctor: "Dr. Truc",
          time: "06/04 10:00",
          status: { label: "Confirmed", tone: "success" },
        },
        summary: "Lịch khám follow-up, đã gửi reminder đầy đủ.",
        meta: [
          { label: "Clinic", value: "A2" },
          { label: "Channel", value: "Portal" },
        ],
      },
      {
        id: "ad2",
        cells: {
          appointment: { label: "APT-2026-1116", sublabel: "Nguyen Minh Chau" },
          doctor: "Dr. Hai",
          time: "06/04 13:30",
          status: { label: "Rescheduled", tone: "warning" },
        },
        summary: "Dời do bác sĩ có thay đổi lịch đột xuất.",
        meta: [
          { label: "Reason", value: "Doctor unavailable" },
          { label: "Ops owner", value: "Support team" },
        ],
      },
    ],
    quickActions: ["Xem lịch quá tải", "Dời lịch hàng loạt", "Xuất báo cáo ca khám"],
    emptyTitle: "Không có lịch hẹn",
    emptyDescription: "Thử nới bộ lọc để xem thêm lịch từ hệ thống.",
    backendModule: "appointments",
    integrationNote: "Backend appointments đã có; admin orchestration và bulk actions đang mock.",
  }),
  "role-permissions": buildModule({
    id: "role-permissions",
    title: "Quản lý phân quyền vai trò",
    description: "Đồng bộ role, permission và kiểm soát những menu nào được hiển thị trong sidebar.",
    searchPlaceholder: "Tìm role hoặc permission...",
    statusLabel: "Admin module",
    metrics: [
      { label: "Role active", value: "5", delta: "2 role nội bộ" },
      { label: "Permission keys", value: "24", delta: "Bao phủ dashboard hiện tại", tone: "info" },
      { label: "Xung đột cần review", value: "2", delta: "Permission chồng chéo", tone: "warning" },
    ],
    columns: [
      { key: "role", label: "Vai trò" },
      { key: "scope", label: "Phạm vi" },
      { key: "grants", label: "Quyền" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "rp1",
        cells: {
          role: { label: "doctor", sublabel: "Clinical workspace" },
          scope: "Doctor dashboard",
          grants: "9 quyền",
          status: { label: "Active", tone: "success" },
        },
        summary: "Sidebar doctor lấy trực tiếp từ grants của role này.",
        meta: [
          { label: "Users assigned", value: "168" },
          { label: "Last update", value: "Hôm nay" },
        ],
      },
      {
        id: "rp2",
        cells: {
          role: { label: "admin", sublabel: "Platform operations" },
          scope: "Admin dashboard",
          grants: "18 quyền",
          status: { label: "Active", tone: "success" },
        },
        summary: "Có quyền quản lý toàn bộ module backend đang expose cho dashboard.",
        meta: [
          { label: "Users assigned", value: "12" },
          { label: "Critical access", value: "Yes" },
        ],
      },
    ],
    quickActions: ["Tạo role", "Gán quyền", "So sánh role"],
    emptyTitle: "Không có role nào",
    emptyDescription: "Tạo role mới để bắt đầu gán quyền cho dashboard.",
    backendModule: "roles / permissions / role-permission",
    integrationNote: "Backend có roles, permissions, role-permission nhưng controller permissions/roles còn mỏng; matrix UI đang mock.",
  }),
  ratings: buildModule({
    id: "ratings",
    title: "Quản lý đánh giá",
    description: "Theo dõi phản hồi chất lượng dịch vụ và những case cần can thiệp sớm.",
    searchPlaceholder: "Tìm theo bác sĩ, sao đánh giá, từ khóa...",
    statusLabel: "Admin module",
    metrics: [
      { label: "Đánh giá mới", value: "38", delta: "24h qua" },
      { label: "Điểm thấp cần xử lý", value: "4", delta: "Dưới 3 sao", tone: "warning" },
      { label: "Điểm trung bình", value: "4.8", delta: "Ổn định" },
    ],
    columns: [
      { key: "reviewer", label: "Người đánh giá" },
      { key: "doctor", label: "Bác sĩ" },
      { key: "score", label: "Điểm" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "rt1",
        cells: {
          reviewer: { label: "Pham Mai Chi", sublabel: "Sau lịch APT-2026-0822" },
          doctor: "Dr. Truc",
          score: "5/5",
          status: { label: "Published", tone: "success" },
        },
        summary: "Khen tốc độ phản hồi và giải thích dễ hiểu.",
        meta: [
          { label: "Ngày tạo", value: "03/04/2026" },
          { label: "Follow-up", value: "Không" },
        ],
      },
      {
        id: "rt2",
        cells: {
          reviewer: { label: "Nguyen Tuan Kiet", sublabel: "Sau lịch APT-2026-0741" },
          doctor: "Dr. Hai",
          score: "2/5",
          status: { label: "Needs attention", tone: "warning" },
        },
        summary: "Phàn nàn việc dời lịch liên tục và thời gian chờ lâu.",
        meta: [
          { label: "Assigned", value: "Ops QA" },
          { label: "Ticket", value: "CMP-211" },
        ],
      },
    ],
    quickActions: ["Xem đánh giá thấp", "Gắn cờ follow-up", "Xuất báo cáo CSAT"],
    emptyTitle: "Chưa có đánh giá nào",
    emptyDescription: "Dữ liệu satisfaction rating sẽ xuất hiện sau khi có phản hồi bệnh nhân.",
    backendModule: "satisfaction-rating",
    integrationNote: "Backend satisfaction-rating module có sẵn; moderation workflow đang mock.",
  }),
  "exam-results": buildModule({
    id: "exam-results",
    title: "Quản lý kết quả khám",
    description: "Danh sách kết quả khám, tài liệu đính kèm và trạng thái bàn giao cho bệnh nhân.",
    searchPlaceholder: "Tìm kết quả khám, bác sĩ, bệnh nhân...",
    statusLabel: "Admin module",
    metrics: [
      { label: "Kết quả mới", value: "27", delta: "Trong 24h qua" },
      { label: "Chưa gửi bệnh nhân", value: "6", delta: "Cần duyệt", tone: "warning" },
      { label: "Có file đính kèm", value: "91%", delta: "Ảnh/PDF đầy đủ", tone: "success" },
    ],
    columns: [
      { key: "patient", label: "Bệnh nhân" },
      { key: "doctor", label: "Bác sĩ" },
      { key: "document", label: "Kết quả" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "ex1",
        cells: {
          patient: { label: "Nguyễn Thu An", sublabel: "RESULT-8841" },
          doctor: "Dr. Truc",
          document: "Kết luận khám + PDF",
          status: { label: "Ready to send", tone: "info" },
        },
        summary: "Kết luận sau nội soi, đã có file PDF và ghi chú điều trị.",
        meta: [
          { label: "Ngày tạo", value: "03/04/2026" },
          { label: "Clinic", value: "A2" },
        ],
        attachments: [{ id: "e1", name: "visit-result.pdf", type: "pdf", url: attachmentPdf }],
      },
      {
        id: "ex2",
        cells: {
          patient: { label: "Trần Minh Khoa", sublabel: "RESULT-8843" },
          doctor: "Dr. Hai",
          document: "Ảnh siêu âm + kết luận",
          status: { label: "Delivered", tone: "success" },
        },
        summary: "Bệnh nhân đã nhận kết quả trong patient portal.",
        meta: [
          { label: "Delivery", value: "Portal" },
          { label: "Attachments", value: "2 files" },
        ],
        attachments: [
          { id: "e2", name: "ultrasound.jpg", type: "image", url: attachmentImage },
          { id: "e3", name: "result-summary.pdf", type: "pdf", url: attachmentPdf },
        ],
      },
    ],
    quickActions: ["Tạo kết quả mới", "Gửi cho bệnh nhân", "Kiểm tra file lỗi"],
    emptyTitle: "Chưa có kết quả khám",
    emptyDescription: "Khi bác sĩ hoàn tất kết luận, dữ liệu sẽ hiển thị tại đây.",
    backendModule: "examination-result",
    integrationNote: "Backend examination-result đã có; workflow publish/deliver hiện đang mock.",
  }),
  relatives: buildModule({
    id: "relatives",
    title: "Quản lý người thân",
    description: "Xem quan hệ giữa tài khoản bệnh nhân và người thân được ủy quyền theo dõi hồ sơ.",
    searchPlaceholder: "Tìm người thân, bệnh nhân chính, quan hệ...",
    statusLabel: "Admin module",
    metrics: [
      { label: "Quan hệ đang hoạt động", value: "1.2k", delta: "+41 tuần này" },
      { label: "Cần xác minh", value: "14", delta: "Thiếu giấy tờ", tone: "warning" },
      { label: "Có nhiều hồ sơ liên kết", value: "72", delta: "Gia đình 2-4 người" },
    ],
    columns: [
      { key: "relative", label: "Người thân" },
      { key: "patient", label: "Bệnh nhân chính" },
      { key: "relationship", label: "Quan hệ" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "re1",
        cells: {
          relative: { label: "Lê Thanh Thu", sublabel: "ACC-4021" },
          patient: "Lê Thanh Hà",
          relationship: "Mẹ",
          status: { label: "Verified", tone: "success" },
        },
        summary: "Được phép xem lịch khám và hồ sơ sức khỏe cơ bản.",
        meta: [
          { label: "Quyền", value: "Appointments, Health profile" },
          { label: "Ngày liên kết", value: "21/03/2026" },
        ],
      },
      {
        id: "re2",
        cells: {
          relative: { label: "Nguyen Phuoc Khang", sublabel: "ACC-4184" },
          patient: "Nguyễn Thu An",
          relationship: "Chồng",
          status: { label: "Pending docs", tone: "warning" },
        },
        summary: "Chưa đủ ảnh giấy tờ xác nhận quan hệ.",
        meta: [
          { label: "Step", value: "Document review" },
          { label: "Owner", value: "Support team" },
        ],
      },
    ],
    quickActions: ["Tạo liên kết", "Xác minh hồ sơ", "Xuất danh sách gia đình"],
    emptyTitle: "Không có người thân nào",
    emptyDescription: "Liên kết người thân sẽ hiển thị tại đây khi bệnh nhân tạo mới.",
    backendModule: "relatives",
    integrationNote: "Backend relatives đã có; permission scope per-relative vẫn đang mock.",
  }),
  "audit-logs": buildModule({
    id: "audit-logs",
    title: "Quản lý audit logs",
    description: "Theo dõi thao tác hệ thống, thay đổi quyền và các hành vi có rủi ro.",
    searchPlaceholder: "Tìm user, action, entity, IP...",
    statusLabel: "Admin module",
    metrics: [
      { label: "Events hôm nay", value: "91", delta: "14 login, 27 update" },
      { label: "Cảnh báo cao", value: "5", delta: "Cần security review", tone: "danger" },
      { label: "Role changes", value: "3", delta: "Liên quan admin panel", tone: "warning" },
    ],
    columns: [
      { key: "actor", label: "Người thao tác" },
      { key: "action", label: "Hành động" },
      { key: "target", label: "Đối tượng" },
      { key: "status", label: "Mức độ" },
    ],
    rows: [
      {
        id: "al1",
        cells: {
          actor: { label: "admin@medihub.vn", sublabel: "192.168.1.24" },
          action: "Grant permission",
          target: "role: content_moderator",
          status: { label: "Info", tone: "info" },
        },
        summary: "Gán 6 quyền liên quan content + notification.",
        meta: [
          { label: "Thời gian", value: "03/04/2026 08:15" },
          { label: "Entity", value: "role-permission" },
        ],
      },
      {
        id: "al2",
        cells: {
          actor: { label: "unknown-session", sublabel: "45.119.xx.xx" },
          action: "Failed admin login",
          target: "admin panel",
          status: { label: "High", tone: "danger" },
        },
        summary: "Đăng nhập thất bại nhiều lần từ IP lạ.",
        meta: [
          { label: "Attempts", value: "7" },
          { label: "Escalation", value: "Security" },
        ],
      },
    ],
    quickActions: ["Xem cảnh báo cao", "Xuất log", "Lọc theo IP"],
    emptyTitle: "Không có audit event",
    emptyDescription: "Khi có thao tác hệ thống, audit log sẽ hiển thị tại đây.",
    backendModule: "audit-logs",
    integrationNote: "Backend có entity/module audit-logs; cần xác nhận controller/list endpoint cho admin UI.",
  }),
  "health-profiles": buildModule({
    id: "health-profiles",
    title: "Quản lý hồ sơ sức khỏe",
    description: "Quản lý profile sức khỏe bệnh nhân, bệnh nền và các chỉ số cập nhật gần đây.",
    searchPlaceholder: "Tìm bệnh nhân, hồ sơ, bệnh nền...",
    statusLabel: "Admin module",
    metrics: [
      { label: "Hồ sơ sức khỏe", value: "8.1k", delta: "+138 mới tuần này" },
      { label: "Thiếu metadata", value: "29", delta: "Cần bổ sung chiều cao/cân nặng", tone: "warning" },
      { label: "Đã đồng bộ", value: "96%", delta: "Portal + admin", tone: "success" },
    ],
    columns: [
      { key: "profile", label: "Hồ sơ" },
      { key: "owner", label: "Chủ hồ sơ" },
      { key: "condition", label: "Bệnh nền" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "hp1",
        cells: {
          profile: { label: "HP-22014", sublabel: "Cập nhật 02/04/2026" },
          owner: "Nguyễn Hoài Nam",
          condition: "Viêm loét dạ dày",
          status: { label: "Complete", tone: "success" },
        },
        summary: "Có đầy đủ allergy, tiền sử phẫu thuật và chỉ số gần nhất.",
        meta: [
          { label: "Owner", value: "Patient" },
          { label: "Relatives linked", value: "1" },
        ],
      },
      {
        id: "hp2",
        cells: {
          profile: { label: "HP-22031", sublabel: "Cập nhật 03/04/2026" },
          owner: "Bùi Hương Ly",
          condition: "Đau bụng chưa rõ nguyên nhân",
          status: { label: "Missing fields", tone: "warning" },
        },
        summary: "Thiếu mục tiền sử dị ứng thuốc.",
        meta: [
          { label: "Prompt source", value: "Patient intake" },
          { label: "Next action", value: "Request completion" },
        ],
      },
    ],
    quickActions: ["Tạo profile", "Nhắc bổ sung", "Xem hồ sơ thiếu dữ liệu"],
    emptyTitle: "Chưa có hồ sơ sức khỏe",
    emptyDescription: "Khi user tạo health profile, dữ liệu sẽ xuất hiện tại đây.",
    backendModule: "health-profile",
    integrationNote: "Backend health-profile đã có; admin bulk review đang mock.",
  }),
  relationships: buildModule({
    id: "relationships",
    title: "Quản lý quan hệ",
    description: "Quản lý danh mục quan hệ để tái sử dụng khi tạo người thân và liên kết hồ sơ.",
    searchPlaceholder: "Tìm loại quan hệ, mô tả, trạng thái...",
    statusLabel: "Admin module",
    metrics: [
      { label: "Loại quan hệ", value: "12", delta: "Đang dùng hệ thống" },
      { label: "Cần chuẩn hóa", value: "2", delta: "Trùng nghĩa", tone: "warning" },
      { label: "Liên kết sử dụng", value: "1.2k", delta: "Across relatives" },
    ],
    columns: [
      { key: "relationship", label: "Quan hệ" },
      { key: "scope", label: "Phạm vi" },
      { key: "usage", label: "Sử dụng" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "rl1",
        cells: {
          relationship: { label: "Mẹ", sublabel: "mother" },
          scope: "Người thân",
          usage: "326 liên kết",
          status: { label: "Active", tone: "success" },
        },
        summary: "Quan hệ dùng nhiều nhất trong nhóm pediatric care.",
        meta: [
          { label: "Locale", value: "vi-VN" },
          { label: "Synonyms", value: "0" },
        ],
      },
      {
        id: "rl2",
        cells: {
          relationship: { label: "Người giám hộ", sublabel: "guardian" },
          scope: "Người thân",
          usage: "48 liên kết",
          status: { label: "Review naming", tone: "warning" },
        },
        summary: "Đề xuất đổi nhãn hiển thị sang “Giám hộ hợp pháp”.",
        meta: [
          { label: "Requester", value: "Legal team" },
          { label: "Impact", value: "Form copy" },
        ],
      },
    ],
    quickActions: ["Tạo loại quan hệ", "Đổi tên", "Xuất dictionary"],
    emptyTitle: "Không có loại quan hệ",
    emptyDescription: "Tạo danh mục quan hệ để người dùng chọn khi liên kết người thân.",
    backendModule: "relationship",
    integrationNote: "Backend relationship entity có; cần xác nhận module/controller public cho admin UI.",
  }),
  specialties: buildModule({
    id: "specialties",
    title: "Quản lý chuyên khoa",
    description: "Quản lý chuyên khoa, mức tải và số lượng bác sĩ được phân vào từng nhóm.",
    searchPlaceholder: "Tìm chuyên khoa, trưởng khoa, trạng thái...",
    statusLabel: "Admin module",
    metrics: [
      { label: "Chuyên khoa", value: "12", delta: "4 nhóm tăng trưởng cao" },
      { label: "Bác sĩ phân bổ đủ", value: "9", delta: "3 chuyên khoa thiếu nhân sự", tone: "warning" },
      { label: "Topic liên kết", value: "18", delta: "Content mapped" },
    ],
    columns: [
      { key: "specialty", label: "Chuyên khoa" },
      { key: "lead", label: "Lead" },
      { key: "doctors", label: "Bác sĩ" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "sp1",
        cells: {
          specialty: { label: "Nội tổng quát", sublabel: "SPEC-01" },
          lead: "Dr. Truc",
          doctors: "42 bác sĩ",
          status: { label: "Healthy", tone: "success" },
        },
        summary: "Chuyên khoa có lượng lịch khám cao và nội dung mạnh.",
        meta: [
          { label: "Avg load", value: "74%" },
          { label: "Topics", value: "6" },
        ],
      },
      {
        id: "sp2",
        cells: {
          specialty: { label: "Gan mật", sublabel: "SPEC-07" },
          lead: "Dr. Hai",
          doctors: "8 bác sĩ",
          status: { label: "Needs staffing", tone: "warning" },
        },
        summary: "Năng lực đang thấp hơn nhu cầu lịch khám tuần tới.",
        meta: [
          { label: "Open slots", value: "12" },
          { label: "Waitlist", value: "18" },
        ],
      },
    ],
    quickActions: ["Tạo chuyên khoa", "Gán bác sĩ", "Xem tải theo khoa"],
    emptyTitle: "Chưa có chuyên khoa",
    emptyDescription: "Khi hệ thống có specialty data, thông tin sẽ hiển thị tại đây.",
    backendModule: "specialties",
    integrationNote: "Backend specialties đã có; dashboard capacity by specialty đang mock.",
  }),
  complaints: buildModule({
    id: "complaints",
    title: "Quản lý các phản hồi",
    description: "Theo dõi khiếu nại, phản hồi vận hành và escalation cần xử lý nhanh.",
    searchPlaceholder: "Tìm theo ticket, người gửi, chủ đề...",
    statusLabel: "Admin module",
    metrics: [
      { label: "Ticket mở", value: "9", delta: "2 urgent", tone: "warning" },
      { label: "Đã giải quyết", value: "31", delta: "Trong 7 ngày", tone: "success" },
      { label: "Escalated", value: "2", delta: "Cần lead review", tone: "danger" },
    ],
    columns: [
      { key: "ticket", label: "Ticket" },
      { key: "category", label: "Nhóm" },
      { key: "owner", label: "Owner" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "cm1",
        cells: {
          ticket: { label: "CMP-211", sublabel: "Nguyen Tuan Kiet" },
          category: "Dời lịch nhiều lần",
          owner: "Ops QA",
          status: { label: "Investigating", tone: "warning" },
        },
        summary: "Liên quan 2 lịch hẹn liên tiếp cùng một bác sĩ.",
        meta: [
          { label: "Priority", value: "High" },
          { label: "Opened", value: "02/04/2026" },
        ],
      },
      {
        id: "cm2",
        cells: {
          ticket: { label: "CMP-209", sublabel: "Pham Mai Chi" },
          category: "Khen ngợi bác sĩ và app",
          owner: "Care team",
          status: { label: "Closed", tone: "success" },
        },
        summary: "Feedback tích cực được dùng cho quality insight.",
        meta: [
          { label: "Channel", value: "Post-visit survey" },
          { label: "Type", value: "Positive" },
        ],
      },
    ],
    quickActions: ["Tạo ticket", "Xem urgent", "Phân công owner"],
    emptyTitle: "Không có phản hồi nào",
    emptyDescription: "Complaint và feedback từ bệnh nhân sẽ hiện ở đây.",
    backendModule: "complaints",
    integrationNote: "Backend complaints module có; cần xác nhận dashboard-friendly list/filter endpoint.",
  }),
  notifications: buildModule({
    id: "notifications",
    title: "Quản lý thông báo",
    description: "Quản trị chiến dịch thông báo hệ thống, nhắc lịch và phân khúc người nhận.",
    searchPlaceholder: "Tìm campaign, nội dung, trạng thái...",
    statusLabel: "Admin module",
    metrics: [
      { label: "Campaign live", value: "12", delta: "4 theo lịch hẹn" },
      { label: "Scheduled", value: "7", delta: "Gửi trong 48h", tone: "info" },
      { label: "Paused", value: "2", delta: "Chờ copy review", tone: "warning" },
    ],
    columns: [
      { key: "campaign", label: "Campaign" },
      { key: "segment", label: "Segment" },
      { key: "delivery", label: "Delivery" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "nt1",
        cells: {
          campaign: { label: "remind-appt-morning", sublabel: "Nhắc lịch sáng" },
          segment: "Bệnh nhân có lịch trong 24h",
          delivery: "320 recipients",
          status: { label: "Live", tone: "success" },
        },
        summary: "Đang gửi tự động theo cron buổi sáng.",
        meta: [
          { label: "Channel", value: "In-app + email" },
          { label: "CTR", value: "48%" },
        ],
      },
      {
        id: "nt2",
        cells: {
          campaign: { label: "complete-health-profile", sublabel: "Nhắc hoàn thiện hồ sơ" },
          segment: "User thiếu metadata",
          delivery: "1.2k recipients",
          status: { label: "Scheduled", tone: "info" },
        },
        summary: "Campaign để kéo completion health profile.",
        meta: [
          { label: "Send time", value: "04/04 08:00" },
          { label: "Owner", value: "Growth ops" },
        ],
      },
    ],
    quickActions: ["Tạo campaign", "Xem scheduled", "Nhân bản thông báo"],
    emptyTitle: "Chưa có thông báo nào",
    emptyDescription: "Chiến dịch thông báo sẽ xuất hiện tại đây khi được tạo.",
    backendModule: "notifications",
    integrationNote: "Backend notifications module có; scheduling analytics và segment preview đang mock.",
  }),
};
