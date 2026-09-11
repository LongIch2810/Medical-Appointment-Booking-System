import {
  CalendarClock,
  Stethoscope,
  UsersRound,
  Wallet,
} from "lucide-react";

import type { EnterpriseReportGroup } from "@/types/interface/enterpriseReport.interface";

export const enterpriseReportGroups: EnterpriseReportGroup[] = [
  {
    id: "booking-operations",
    title: "Vận hành Đặt lịch",
    description: "Hiệu quả vận hành của quy trình đặt lịch khám.",
    icon: CalendarClock,
    items: [
      {
        id: "booking-success-cancel-noshow",
        title: "Thống kê đặt lịch & tỷ lệ hủy/no-show",
        description:
          "Tổng số lượt đặt lịch thành công, tỷ lệ hủy lịch và tỷ lệ bệnh nhân không đến (no-show).",
        quickStat: { label: "Lượt đặt tháng này", value: "1.248" },
      },
      {
        id: "patient-flow-by-timeslot",
        title: "Lưu lượng bệnh nhân theo khung giờ",
        description:
          "Biểu đồ lưu lượng bệnh nhân theo khung giờ trong ngày và theo từng ngày trong tuần.",
        quickStat: { label: "Khung giờ cao điểm", value: "09:00–10:30" },
      },
    ],
  },
  {
    id: "doctor-specialty-performance",
    title: "Hiệu suất Bác sĩ & Chuyên khoa",
    description: "Phân bổ khối lượng công việc theo bác sĩ và chuyên khoa.",
    icon: Stethoscope,
    items: [
      {
        id: "appointments-by-specialty",
        title: "Lịch hẹn theo chuyên khoa",
        description: "Số lượng lịch hẹn phân bổ theo từng chuyên khoa.",
        quickStat: { label: "Chuyên khoa dẫn đầu", value: "Nội tổng quát" },
      },
      {
        id: "doctor-fill-rate",
        title: "Tỷ lệ lấp đầy lịch bác sĩ",
        description: "Tỷ lệ lấp đầy lịch trống của đội ngũ bác sĩ.",
        quickStat: { label: "Tỷ lệ lấp đầy TB", value: "82%" },
      },
    ],
  },
  {
    id: "users-profiles",
    title: "Người dùng & Hồ sơ",
    description: "Chân dung người dùng dựa trên hồ sơ sức khỏe tự khai.",
    icon: UsersRound,
    items: [
      {
        id: "user-demographics",
        title: "Nhân khẩu học người dùng",
        description: "Phân tích nhân khẩu học cơ bản: độ tuổi, giới tính, khu vực.",
        quickStat: { label: "Người dùng hoạt động", value: "3.420" },
      },
      {
        id: "common-health-needs",
        title: "Nhu cầu khám phổ biến (theo hồ sơ sức khỏe)",
        description:
          "Thống kê các triệu chứng/nhu cầu khám phổ biến nhất, tổng hợp từ hồ sơ sức khỏe (health profile) người dùng tự khai — không sử dụng bệnh án lâm sàng.",
        quickStat: { label: "Nhu cầu phổ biến nhất", value: "Đau đầu, mất ngủ" },
      },
    ],
  },
  {
    id: "financial-overview",
    title: "Tài chính (Tổng quan)",
    description: "Bức tranh doanh thu tổng quan theo thời gian và chuyên khoa.",
    icon: Wallet,
    items: [
      {
        id: "revenue-by-period",
        title: "Doanh thu dự kiến theo ngày/tháng",
        description: "Tổng doanh thu dự kiến theo ngày và theo tháng.",
        quickStat: { label: "Doanh thu tháng này", value: "412 triệu ₫" },
      },
      {
        id: "revenue-by-specialty",
        title: "Doanh thu theo chuyên khoa",
        description: "Doanh thu mang lại từ từng chuyên khoa.",
        quickStat: { label: "Chuyên khoa cao nhất", value: "Tim mạch" },
      },
    ],
  },
];
