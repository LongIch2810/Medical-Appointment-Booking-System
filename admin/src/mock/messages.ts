import type { ConversationThread } from "@/types/app";

const attachmentImage =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80";
const attachmentPdf =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

export const messageThreads: ConversationThread[] = [
  {
    id: "conv-1",
    patientName: "Bùi Hương Ly",
    lastMessage: "Em vừa gửi thêm ảnh toa thuốc và phiếu siêu âm ạ.",
    unreadCount: 2,
    age: 29,
    concern: "Đau bụng kéo dài",
    riskLevel: "Medium",
    updatedAt: "09:18",
    details: [
      { label: "Patient ID", value: "BN-30214" },
      { label: "Bác sĩ phụ trách", value: "Dr. Truc" },
      { label: "Appointment", value: "06/04/2026 - 14:00" },
      { label: "Health profile", value: "Thiếu dị ứng thuốc" },
    ],
    attachments: [
      { id: "m1", name: "prescription.jpg", type: "image", url: attachmentImage },
      { id: "m2", name: "ultrasound-note.pdf", type: "pdf", url: attachmentPdf },
    ],
    messages: [
      { id: "m-1", sender: "patient", content: "Bác sĩ ơi em đau vùng thượng vị từ tối qua.", time: "08:34" },
      { id: "m-2", sender: "doctor", content: "Bạn gửi giúp tôi toa thuốc đang dùng và kết quả siêu âm gần nhất nhé.", time: "08:37" },
      {
        id: "m-3",
        sender: "patient",
        content: "Em vừa gửi thêm ảnh toa thuốc và phiếu siêu âm ạ.",
        time: "09:18",
        attachments: [
          { id: "mx1", name: "prescription.jpg", type: "image", url: attachmentImage },
          { id: "mx2", name: "ultrasound-note.pdf", type: "pdf", url: attachmentPdf },
        ],
      },
    ],
  },
  {
    id: "conv-2",
    patientName: "Nguyễn Đức Anh",
    lastMessage: "Kết quả men gan em đã tải lên rồi bác sĩ xem giúp em.",
    unreadCount: 0,
    age: 38,
    concern: "Đọc kết quả xét nghiệm",
    riskLevel: "Low",
    updatedAt: "Hôm qua",
    details: [
      { label: "Patient ID", value: "BN-29910" },
      { label: "Appointment", value: "06/04/2026 - 11:00" },
      { label: "Tài liệu mới", value: "1 PDF" },
      { label: "Risk", value: "Low" },
    ],
    attachments: [{ id: "m3", name: "lab-summary.pdf", type: "pdf", url: attachmentPdf }],
    messages: [
      { id: "m-4", sender: "patient", content: "Kết quả men gan em đã tải lên rồi bác sĩ xem giúp em.", time: "Hôm qua" },
      { id: "m-5", sender: "doctor", content: "Tôi đã nhận được, sáng mai bạn đến đúng lịch để trao đổi kỹ hơn.", time: "Hôm qua" },
    ],
  },
];
