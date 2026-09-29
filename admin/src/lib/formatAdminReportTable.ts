import type { AdminReportTableColumn } from "@/types/interface/adminReport.interface";

const COLUMN_LABELS: Record<string, string> = {
  appointment_count: "Số lịch khám",
  appointment_date: "Ngày khám",
  cancelled_appointments: "Lịch khám đã hủy",
  completed_appointments: "Lịch khám đã hoàn thành",
  date: "Ngày",
  day_of_week: "Ngày trong tuần",
  doctor_fullname: "Tên bác sĩ",
  doctor_name: "Tên bác sĩ",
  month: "Tháng",
  patient_count: "Số bệnh nhân",
  patient_name: "Tên bệnh nhân",
  pending_appointments: "Lịch khám chờ xác nhận",
  registration_date: "Ngày đăng ký",
  registration_month: "Tháng đăng ký",
  role: "Vai trò",
  roles: "Vai trò",
  specialty: "Chuyên khoa",
  specialty_name: "Chuyên khoa",
  start_time: "Giờ bắt đầu",
  status: "Trạng thái",
  total: "Tổng số",
  total_appointments: "Tổng số lịch khám",
  total_patients: "Tổng số bệnh nhân",
  total_users: "Tổng số người dùng",
  user_count: "Số người dùng",
};

const WEEKDAY_LABELS: Record<number, string> = {
  0: "Chủ nhật",
  1: "Thứ hai",
  2: "Thứ ba",
  3: "Thứ tư",
  4: "Thứ năm",
  5: "Thứ sáu",
  6: "Thứ bảy",
};

function normalizeColumnKey(key: string) {
  return key.trim().toLowerCase();
}

export function formatAdminReportCell(
  columnKey: string,
  value: string | number,
): string | number {
  if (normalizeColumnKey(columnKey) !== "day_of_week") return value;

  const weekday = typeof value === "number" ? value : Number(value);
  return Number.isInteger(weekday) && WEEKDAY_LABELS[weekday]
    ? WEEKDAY_LABELS[weekday]
    : value;
}

export function localizeAdminReportTable(
  columns: AdminReportTableColumn[],
  rows: Record<string, string | number>[],
) {
  const localizedColumns = columns.map((column) => ({
    ...column,
    label: COLUMN_LABELS[normalizeColumnKey(column.key)] ?? column.label,
  }));

  const localizedRows = rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        formatAdminReportCell(key, value),
      ]),
    ),
  );

  return { columns: localizedColumns, rows: localizedRows };
}
