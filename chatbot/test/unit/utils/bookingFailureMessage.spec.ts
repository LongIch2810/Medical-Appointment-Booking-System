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

  assert.equal(
    message,
    "CHƯA ĐẶT LỊCH: Nam chưa có lịch khám Lão khoa vào 25/08/2026 lúc 12:00 vì không còn ca trống. Vui lòng chọn ngày hoặc giờ khác."
  );
  assert.equal(message.includes("ĐẶT LỊCH THÀNH CÔNG"), false);
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
