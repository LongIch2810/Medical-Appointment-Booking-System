// Mọi câu trả lời dựng cứng (không qua LLM) của chatbot phải dùng hàm này
// để đảm bảo cùng 1 cấu trúc Markdown: Tóm tắt / Chi tiết / Lưu ý & Bước
// tiếp theo — tránh copy-paste tiêu đề rồi lệch nhau giữa các nơi gọi.
//
// Không thụt lề dòng nào (thụt lề ≥4 dấu cách bị CommonMark hiểu là code
// block, xem chú thích tương tự trong booking_appointment.tool.ts).
export function formatAnswerTemplate(params: {
  summary: string;
  details: string;
  note: string;
}): string {
  return [
    "**Tóm tắt**",
    params.summary,
    "",
    "**Chi tiết**",
    params.details,
    "",
    "**Lưu ý & Bước tiếp theo**",
    params.note,
  ].join("\n");
}
