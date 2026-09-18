import { describe, expect, it } from "vitest";
import {
  autoBookingSchema,
  isPresetPastForToday,
  TIME_PRESETS,
} from "@/schemas/autoBooking.schema";
import { getVietnamTimeHHmm } from "@/utils/formatDate";

describe("autoBookingSchema", () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  it("chấp nhận dữ liệu hợp lệ khi chọn người thân có sẵn và preset buổi sáng", () => {
    const validData = {
      relative_id: 1,
      is_new_relative: false,
      specialty_id: 3,
      appointment_date: tomorrow,
      time_preset: "morning",
      start_time: "08:00",
      end_time: "12:00",
    };

    const result = autoBookingSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("chặn submit khi chưa chọn người đi khám (relative_id = 0)", () => {
    const data = {
      relative_id: 0,
      is_new_relative: false,
      specialty_id: 2,
      appointment_date: tomorrow,
      time_preset: "morning",
      start_time: "08:00",
      end_time: "12:00",
    };

    const result = autoBookingSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "relative_id"
      );
      expect(issue?.message).toBe("Vui lòng chọn người đi khám");
    }
  });

  it("chặn submit khi chưa chọn chuyên khoa (specialty_id = 0)", () => {
    const data = {
      relative_id: 1,
      is_new_relative: false,
      specialty_id: 0,
      appointment_date: tomorrow,
      time_preset: "morning",
      start_time: "08:00",
      end_time: "12:00",
    };

    const result = autoBookingSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "specialty_id"
      );
      expect(issue?.message).toBe("Vui lòng chọn chuyên khoa khám");
    }
  });

  it("validate thông tin người thân mới khi is_new_relative = true", () => {
    // Thiếu họ tên và mối quan hệ
    const invalidData = {
      relative_id: 0,
      is_new_relative: true,
      new_relative: {
        fullname: "A",
        relationship_code: "",
        gender: "true",
        dob: "",
        phone: "01234",
      },
      specialty_id: 1,
      appointment_date: tomorrow,
      time_preset: "morning",
      start_time: "08:00",
      end_time: "12:00",
    };

    const result = autoBookingSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("new_relative.fullname");
      expect(paths).toContain("new_relative.relationship_code");
      expect(paths).toContain("new_relative.phone");
    }
  });

  it("chấp nhận thông tin người thân mới hợp lệ", () => {
    const validData = {
      relative_id: 0,
      is_new_relative: true,
      new_relative: {
        fullname: "Nguyễn Văn B",
        relationship_code: "FATHER",
        gender: "true",
        dob: "1960-05-10",
        phone: "0901234567",
      },
      specialty_id: 1,
      appointment_date: tomorrow,
      time_preset: "afternoon",
      start_time: "13:30",
      end_time: "17:00",
    };

    const result = autoBookingSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("chặn khi end_time <= start_time", () => {
    const data = {
      relative_id: 1,
      is_new_relative: false,
      specialty_id: 1,
      appointment_date: tomorrow,
      time_preset: "custom",
      start_time: "14:00",
      end_time: "10:00",
    };

    const result = autoBookingSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "end_time");
      expect(issue?.message).toBe("Giờ kết thúc phải lớn hơn giờ bắt đầu");
    }
  });

  it("cho phép không có end_time khi tự chọn giờ", () => {
    const data = {
      relative_id: 1,
      is_new_relative: false,
      specialty_id: 1,
      appointment_date: tomorrow,
      time_preset: "custom",
      start_time: "10:00",
      end_time: "",
    };

    const result = autoBookingSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("chặn giờ đã qua nếu chọn ngày khám là hôm nay", () => {
    const today = new Date();
    const pastTime = "00:01";

    const data = {
      relative_id: 1,
      is_new_relative: false,
      specialty_id: 1,
      appointment_date: today,
      time_preset: "custom",
      start_time: pastTime,
      end_time: "23:59",
    };

    const result = autoBookingSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "start_time");
      expect(issue?.message).toBe("Khung giờ này đã qua trong ngày hôm nay");
    }
  });

  it("isPresetPastForToday nhận diện chính xác các preset đã qua trong ngày", () => {
    const today = new Date();
    const currentVnHhmm = getVietnamTimeHHmm(today);

    // Thời gian 00:00 luôn nhỏ hơn hoặc bằng bất kỳ giờ nào trong ngày ngoại trừ 00:00
    expect(isPresetPastForToday("00:00", today)).toBe(true);

    // Thời gian 23:59 luôn lớn hơn giờ hiện tại (trừ phút cuối ngày)
    expect(isPresetPastForToday("23:59", today)).toBe("23:59" <= currentVnHhmm);

    // Với ngày mai, không bao giờ bị coi là đã qua
    expect(isPresetPastForToday("08:00", tomorrow)).toBe(false);
  });

  it("TIME_PRESETS chứa đầy đủ các lựa chọn sáng, chiều, tối, tự chọn", () => {
    const ids = TIME_PRESETS.map((p) => p.id);
    expect(ids).toEqual(["morning", "afternoon", "evening", "custom"]);
  });
});
