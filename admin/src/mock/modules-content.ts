import type { ModuleConfig } from "@/types/app";

function buildModule(config: ModuleConfig): ModuleConfig {
  return config;
}

export const contentModuleConfigs: Record<string, ModuleConfig> = {
  tags: buildModule({
    id: "tags",
    title: "Quản lý tag",
    description: "Chuẩn hóa taxonomy cho bài viết, chủ đề và nội dung tư vấn sức khỏe.",
    searchPlaceholder: "Tìm tag, nhóm tag hoặc độ phủ nội dung...",
    statusLabel: "Shared content module",
    metrics: [
      { label: "Tag hoạt động", value: "34", delta: "8 tag doctor thường dùng" },
      { label: "Tag trùng nghĩa", value: "5", delta: "Cần gộp taxonomy", tone: "warning" },
      { label: "Bài viết gắn tag", value: "186", delta: "92% đã chuẩn hóa", tone: "success" },
    ],
    columns: [
      { key: "tag", label: "Tag" },
      { key: "scope", label: "Phạm vi" },
      { key: "usage", label: "Sử dụng" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "tg1",
        cells: {
          tag: { label: "nội soi tiêu hóa", sublabel: "slug: noi-soi-tieu-hoa" },
          scope: "Articles, Topics",
          usage: "26 bài viết",
          status: { label: "Healthy", tone: "success" },
        },
        summary: "Được dùng nhiều ở chuyên khoa tiêu hóa và thư viện cẩm nang.",
        meta: [
          { label: "Người cập nhật", value: "Content admin" },
          { label: "Lần sửa", value: "Hôm qua" },
        ],
      },
      {
        id: "tg2",
        cells: {
          tag: { label: "tư vấn sau khám", sublabel: "slug: tu-van-sau-kham" },
          scope: "Messages, Articles",
          usage: "12 luồng nội dung",
          status: { label: "Needs review", tone: "warning" },
        },
        summary: "Tag mới đề xuất bởi bác sĩ, chờ admin chuẩn hóa tên gọi.",
        meta: [
          { label: "Nguồn", value: "Doctor content board" },
          { label: "Loại", value: "Draft taxonomy" },
        ],
      },
    ],
    quickActions: ["Tạo tag mới", "Gộp tag", "Xuất taxonomy"],
    emptyTitle: "Không tìm thấy tag phù hợp",
    emptyDescription: "Thử lại với từ khóa khác hoặc xóa bộ lọc đang áp dụng.",
    backendModule: "tags",
    integrationNote: "Backend tags module có sẵn; chưa thấy endpoint taxonomy analytics nên đang mock metric usage.",
  }),
  articles: buildModule({
    id: "articles",
    title: "Quản lý bài viết",
    description: "Theo dõi nội dung bác sĩ/admin xuất bản, trạng thái review và hiệu quả tiếp cận.",
    searchPlaceholder: "Tìm theo tiêu đề, tác giả, topic...",
    statusLabel: "Shared content module",
    metrics: [
      { label: "Bài đang live", value: "118", delta: "12 bài mới tháng này", tone: "success" },
      { label: "Draft cần duyệt", value: "9", delta: "4 bài do bác sĩ tạo", tone: "warning" },
      { label: "Hiệu suất cao", value: "22", delta: "Top 20% lượt đọc", tone: "info" },
    ],
    columns: [
      { key: "title", label: "Bài viết" },
      { key: "author", label: "Tác giả" },
      { key: "topic", label: "Topic" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "ar1",
        cells: {
          title: { label: "Chăm sóc sau nội soi dạ dày", sublabel: "ART-2026-022" },
          author: "Dr. Truc",
          topic: "Tiêu hóa",
          status: { label: "Published", tone: "success" },
        },
        summary: "Bài viết đang có CTR cao trong nhóm bệnh nhân follow-up.",
        meta: [
          { label: "Lượt xem", value: "12.4k" },
          { label: "Ngày đăng", value: "02/04/2026" },
        ],
      },
      {
        id: "ar2",
        cells: {
          title: { label: "6 dấu hiệu cần tái khám gan mật", sublabel: "ART-2026-034" },
          author: "Content Team",
          topic: "Gan mật",
          status: { label: "In review", tone: "warning" },
        },
        summary: "Cần bác sĩ xác minh phần triệu chứng báo động.",
        meta: [
          { label: "Reviewer", value: "Dr. Hai" },
          { label: "Tag", value: "gan mat, canh bao" },
        ],
      },
    ],
    quickActions: ["Tạo bài mới", "Duyệt draft", "Xem bài hiệu suất cao"],
    emptyTitle: "Chưa có bài viết",
    emptyDescription: "Tạo bài mới hoặc nhập thêm nội dung từ đội ngũ chuyên môn.",
    backendModule: "articles",
    integrationNote: "Backend articles đã có; metric performance hiện chưa thấy API analytics nên đang mock.",
  }),
  topics: buildModule({
    id: "topics",
    title: "Quản lý topic",
    description: "Nhóm bài viết và tri thức sức khỏe theo chuyên đề để điều hướng nội dung dễ hơn.",
    searchPlaceholder: "Tìm topic, mô tả, chuyên khoa...",
    statusLabel: "Shared content module",
    metrics: [
      { label: "Topic đang dùng", value: "18", delta: "4 chuyên đề mới" },
      { label: "Topic thiếu bài", value: "3", delta: "Cần bổ sung nội dung", tone: "warning" },
      { label: "Topic liên chuyên khoa", value: "6", delta: "Hỗ trợ cross-link" },
    ],
    columns: [
      { key: "topic", label: "Topic" },
      { key: "owner", label: "Owner" },
      { key: "articles", label: "Bài viết" },
      { key: "status", label: "Trạng thái" },
    ],
    rows: [
      {
        id: "tp1",
        cells: {
          topic: { label: "Tiêu hóa nền tảng", sublabel: "Điều hướng cho bệnh nhân mới" },
          owner: "Content admin",
          articles: "24 bài",
          status: { label: "Stable", tone: "success" },
        },
        summary: "Topic trụ cột cho SEO và patient education.",
        meta: [
          { label: "Specialty", value: "Tiêu hóa" },
          { label: "Tag liên quan", value: "9" },
        ],
      },
      {
        id: "tp2",
        cells: {
          topic: { label: "Theo dõi sau điều trị", sublabel: "Phục vụ message + article" },
          owner: "Dr. Truc",
          articles: "7 bài",
          status: { label: "Growing", tone: "info" },
        },
        summary: "Đang được dùng làm nhóm nội dung cho chăm sóc sau khám.",
        meta: [
          { label: "Doctor source", value: "3 bác sĩ" },
          { label: "Mục tiêu", value: "Retention" },
        ],
      },
    ],
    quickActions: ["Tạo topic", "Ghép bài vào topic", "Xem taxonomy map"],
    emptyTitle: "Chưa có topic",
    emptyDescription: "Bắt đầu bằng một chuyên đề mới cho patient education.",
    backendModule: "topics",
    integrationNote: "Backend topics module có sẵn; topic health analytics đang mock.",
  }),
};
