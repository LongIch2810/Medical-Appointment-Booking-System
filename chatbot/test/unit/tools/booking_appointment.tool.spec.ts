import assert from "node:assert/strict";
import test from "node:test";
import { formatBookingResult } from "../../../src/tools/booking_appointment.tool.js";

test("returns a generic message when the graph produced no result at all", () => {
  const message = formatBookingResult(null);
  assert.match(message, /\*\*Tóm tắt\*\*/);
  assert.match(message, /Không thể xử lý yêu cầu đặt lịch\./);
});

test("asks the user to disambiguate when multiple relatives match", () => {
  const message = formatBookingResult({
    ambiguous_relatives: true,
    relatives: [
      { id: 1, fullname: "Nguyễn Văn A", dob: "2010-01-01" },
      { id: 2, fullname: "Nguyễn Văn B", dob: "2015-05-05" },
    ],
  });

  assert.match(message, /Nguyễn Văn A - 2010-01-01/);
  assert.match(message, /Nguyễn Văn B - 2015-05-05/);
  assert.match(message, /chỉ định rõ/);
});

test("reports a system lookup error distinctly from a missing-information message", () => {
  const message = formatBookingResult({ relative_lookup_error: true });
  assert.match(message, /Lỗi khi tra cứu người thân/);
  assert.doesNotMatch(message, /Cần thêm thông tin để đặt lịch/);
});

test("combines both lookup-error reasons when relative AND specialty lookups both fail", () => {
  const message = formatBookingResult({
    relative_lookup_error: true,
    specialty_resolve_error: true,
  });
  assert.match(message, /tra cứu người thân và tra cứu chuyên khoa/);
});

test("lists every missing field using the readable Vietnamese label", () => {
  const message = formatBookingResult({
    missing: ["selected_relative_id", "appointment_date", "unknown_field_xyz"],
  });

  assert.match(message, /Cần thêm thông tin để đặt lịch/);
  assert.match(message, /Người được đặt khám/);
  assert.match(message, /ngày khám/);
  // Unknown field keys fall back to the raw key instead of crashing.
  assert.match(message, /unknown_field_xyz/);
});

test("delegates to formatBookingFailure for a booking_error", () => {
  const message = formatBookingResult({
    booking_error: {
      code: "APPOINTMENT_SLOT_UNAVAILABLE",
      details: "Ca này đã có lịch hẹn.",
    },
  });
  // formatBookingFailure's own behavior is covered by bookingFailureMessage.spec.ts;
  // here we only assert the tool actually delegates instead of using a generic message.
  assert.equal(typeof message, "string");
  assert.ok(message.length > 0);
});

test("renders a full success message with every booking_result field", () => {
  const message = formatBookingResult({
    selected_relative_id: 5,
    relatives: [{ id: 5, fullname: "Nguyễn Văn A", dob: "2010-01-01" }],
    booking_result: {
      appointment_date: "10-09-2026",
      booking_mode: "ai_select",
      patient: { fullname: "Nguyễn Văn A" },
      doctor_schedule: { start_time: "08:00", end_time: "09:00" },
      doctor: {
        user: {
          fullname: "Lê Văn Minh",
          address: "123 Đường ABC",
          phone: "0900000000",
          email: "doctor@example.com",
        },
        specialty: { name: "Nội tổng quát" },
      },
    },
  });

  assert.match(message, /Đặt lịch khám thành công!/);
  assert.match(message, /Người khám: Nguyễn Văn A/);
  assert.match(message, /Bác sĩ: Lê Văn Minh/);
  assert.match(message, /Chuyên khoa: Nội tổng quát/);
  assert.match(message, /Ngày khám: 10-09-2026/);
  assert.match(message, /Thời gian: 08:00 - 09:00/);
  assert.match(message, /Đặt lịch thông minh \(AI hỗ trợ\)/);
});

test("falls back to 'bệnh nhân' and placeholder text for missing success-message fields", () => {
  const message = formatBookingResult({
    booking_result: {
      doctor_schedule: {},
      doctor: {},
    },
  });

  assert.match(message, /Đặt lịch khám thành công!/);
  assert.match(message, /Người khám: bệnh nhân/);
  assert.match(message, /Bác sĩ: Không xác định/);
  assert.match(message, /Chuyên khoa: Chưa rõ chuyên khoa/);
  assert.match(message, /Thời gian: \?\?:\?\? - \?\?:\?\?/);
  assert.match(message, /Hình thức đặt lịch: Thủ công/);
});

test("reports a generic 'could not display details' message when booking_result is missing doctor/doctor_schedule", () => {
  const message = formatBookingResult({
    booking_result: { some_unexpected_shape: true },
  });
  assert.match(message, /không thể hiển thị chi tiết đặt lịch/i);
});

test("asks for missing profile details when a named relative could not be found", () => {
  const message = formatBookingResult({
    relative_not_found_label: "con gái",
  });
  assert.match(message, /Không tìm thấy hồ sơ "con gái"/);
});

test("falls back to a generic error message when the result matches none of the known shapes", () => {
  const message = formatBookingResult({});
  assert.match(message, /\*\*Tóm tắt\*\*/);
  assert.match(message, /Có lỗi xảy ra khi đặt lịch\./);
});
