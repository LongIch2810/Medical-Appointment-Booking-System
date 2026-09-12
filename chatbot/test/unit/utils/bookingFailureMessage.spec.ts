import assert from "node:assert/strict";
import test from "node:test";
import {
  APPOINTMENT_SLOT_UNAVAILABLE,
  formatBookingFailure,
} from "../../../src/utils/bookingFailureMessage.js";

test("formats an unavailable slot as a clear non-successful booking result", () => {
  const message = formatBookingFailure({
    code: APPOINTMENT_SLOT_UNAVAILABLE,
    details: "No matching slot",
    patientName: "Nam",
    specialtyName: "Lão khoa",
    appointmentDate: "2026-08-25",
    startTime: "12:00",
  });

  assert.match(message, /\*\*Tóm tắt\*\*/);
  assert.match(message, /\*\*Chi tiết\*\*/);
  assert.match(message, /\*\*Lưu ý & Bước tiếp theo\*\*/);
  assert.match(
    message,
    /Nam chưa có lịch khám Lão khoa vào 25\/08\/2026 lúc 12:00 vì không còn ca trống\./
  );
  assert.equal(message.includes("Đặt lịch khám thành công"), false);
});

test("preserves non-slot booking failures", () => {
  assert.match(
    formatBookingFailure({
      code: "PATIENT_APPOINTMENT_CONFLICT",
      details: "Bệnh nhân đã có lịch hẹn khác vào thời gian này.",
    }),
    /Bệnh nhân đã có lịch hẹn khác/
  );
});
