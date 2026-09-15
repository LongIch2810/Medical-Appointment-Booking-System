export enum AppointmentStatus {
  PENDING = 'PENDING', // chờ xác nhận
  CONFIRMED = 'CONFIRMED', // đã xác nhận
  IN_PROGRESS = 'IN_PROGRESS', // đang khám
  COMPLETED = 'COMPLETED', // đã khám xong
  CANCELLED = 'CANCELLED', // đã hủy
  ABSENT = 'ABSENT', //vắng mặt
  EXPIRED = 'EXPIRED', // quá hạn khám
}
