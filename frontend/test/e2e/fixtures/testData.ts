// Tài khoản bệnh nhân được seed sẵn trong
// backend/src/database/migrations/1779638786395-seedData.ts — mọi user seed
// (bệnh nhân/bác sĩ/admin) dùng chung 1 mật khẩu đã verify bằng bcrypt.compare
// khi khảo sát repo (không đoán).
export const SEED_PATIENT = {
  usernameOrEmail: "nguyenvanbinh@clinic.vn",
  password: "123456",
};

// specialty_id = 1 trong seed data, luôn có nhiều bác sĩ trực thuộc.
export const SEED_SPECIALTY_NAME = "Nội tổng quát";

// Mọi bác sĩ seed đều làm việc đủ 7 ngày/tuần, cùng 6 khung giờ cố định
// (xem seedData.ts workingHours) — chọn ngẫu nhiên 1 trong 6 mỗi lần chạy để
// giảm khả năng đụng unique_doctor_schedule_date (409) khi chạy lại nhiều
// lần liên tiếp trên cùng 1 DB dev không có bước reset dữ liệu giữa các lần.
const SEED_TIME_SLOTS = [
  "08:00",
  "09:30",
  "11:00",
  "14:00",
  "15:30",
  "17:00",
];

export function pickRandomStartTime(): string {
  return SEED_TIME_SLOTS[Math.floor(Math.random() * SEED_TIME_SLOTS.length)];
}

// Random hóa số ngày trong tương lai (10-60 ngày) vì cùng lý do trên — tránh
// luôn nhắm đúng 1 ngày cố định khiến các lần chạy sau cạn slot bác sĩ trống.
export function pickRandomFutureDayOffset(): number {
  return 10 + Math.floor(Math.random() * 50);
}

export const NEW_RELATIVE_RELATIONSHIP_LABEL = "Con Gái";

export function buildUniqueVnPhone(): string {
  // Số VN hợp lệ theo IsPhoneNumber('VN'): đầu số di động Viettel cố định
  // "098" (chắc chắn hợp lệ) + 7 chữ số cuối lấy từ timestamp để tránh đụng
  // unique constraint giữa các lần chạy test khác nhau (đủ 10 chữ số).
  const suffix = Date.now().toString().slice(-7);
  return `098${suffix}`;
}
