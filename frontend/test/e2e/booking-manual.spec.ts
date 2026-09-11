import { test, expect } from "@playwright/test";
import {
  SEED_SPECIALTY_NAME,
  NEW_RELATIVE_RELATIONSHIP_LABEL,
  buildUniqueVnPhone,
  pickRandomStartTime,
  pickRandomFutureDayOffset,
} from "./fixtures/testData";

// Chọn 1 ngày trong tương lai (né hôm nay/quá khứ) để chắc chắn hợp lệ với
// AppointmentsService.assertNotPastDate. Offset ngẫu nhiên (10-60 ngày, xem
// pickRandomFutureDayOffset) — cùng lý do random hóa start_time: tránh luôn
// nhắm đúng 1 slot bác sĩ cố định khiến các lần chạy lại liên tiếp trên cùng
// DB dev (không có bước reset dữ liệu) bị 409 do slot đã có người đặt.
function getTargetDate() {
  const date = new Date();
  date.setDate(date.getDate() + pickRandomFutureDayOffset());
  return date;
}

// data-day trên nút ngày (frontend/src/components/ui/calendar.tsx) được gán
// bằng day.date.toLocaleDateString() không truyền locale cố định — tính lại
// đúng chuỗi mà trình duyệt sẽ render (né mọi lệch múi giờ bằng cách dựng
// Date từ Y/M/D cục bộ thay vì chuỗi ISO).
async function selectAppointmentDate(page: import("@playwright/test").Page) {
  const today = new Date();
  const target = getTargetDate();

  // Offset ngẫu nhiên có thể lên tới 60 ngày (~2 tháng) — phải bấm "next
  // month" đủ số lần chênh lệch tháng thực tế, không chỉ 0/1 lần.
  const monthsToAdvance =
    (target.getFullYear() - today.getFullYear()) * 12 +
    (target.getMonth() - today.getMonth());

  // Layout nav trong Calendar là justify-between: [prev, caption, next] —
  // nút cuối cùng luôn là "next month", không phụ thuộc label/locale.
  const nextMonthButton = page.locator('[data-slot="calendar"] nav button').last();
  for (let i = 0; i < monthsToAdvance; i++) {
    await nextMonthButton.click();
  }

  const dataDayValue = await page.evaluate(
    ({ y, m, d }) => new Date(y, m - 1, d).toLocaleDateString(),
    { y: target.getFullYear(), m: target.getMonth() + 1, d: target.getDate() }
  );
  await page.locator(`[data-day="${dataDayValue}"]`).click();
}

// Chuyển sang chế độ "+ Thêm người thân mới" rồi chờ tường minh cho tới khi
// select "Mối quan hệ" thực sự có đủ option (useRelationships load xong) mới
// thao tác tiếp. Trang /doctors bắn 4 request song song khi mount (relatives,
// relationships, specialties, danh sách bác sĩ) — trên DB dev cục bộ, request
// danh sách bác sĩ (join nhiều bảng) đôi khi chiếm connection pool khiến các
// request nhẹ hơn như relationships phải đợi, có lúc quan sát được hơn 20s.
// Timeout rộng ở đây thay vì phụ thuộc hoàn toàn vào retry ngầm của
// selectOption (vốn chia sẻ chung ngân sách 30s mặc định của cả test).
async function switchToNewRelativeMode(page: import("@playwright/test").Page) {
  await page
    .getByLabel("Đặt lịch khám cho")
    .selectOption({ label: "+ Thêm người thân mới" });

  const relationshipSelect = page.getByLabel("Mối quan hệ");
  await expect(
    relationshipSelect.getByRole("option", {
      name: NEW_RELATIVE_RELATIONSHIP_LABEL,
    })
  ).toBeAttached({ timeout: 45_000 });
}

test.describe("Đặt lịch nhanh thủ công cho thân nhân mới", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/doctors");
    await page.getByRole("button", { name: "Đặt lịch nhanh" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("đặt lịch thành công khi điền đầy đủ hồ sơ thân nhân mới", async ({
    page,
  }) => {
    await switchToNewRelativeMode(page);

    await page.getByLabel("Họ và tên").fill("Nguyễn Thị Bé Ba (E2E Test)");
    await page
      .getByLabel("Mối quan hệ")
      .selectOption({ label: NEW_RELATIVE_RELATIONSHIP_LABEL });
    await page.getByLabel("Ngày sinh").fill("2015-05-01");
    await page.getByLabel("Giới tính").selectOption({ label: "Nữ" });
    await page
      .getByLabel("Số điện thoại (tùy chọn)")
      .fill(buildUniqueVnPhone());

    await page
      .getByLabel("Chuyên khoa")
      .selectOption({ label: SEED_SPECIALTY_NAME });

    await selectAppointmentDate(page);

    await page.getByLabel("Giờ bắt đầu").fill(pickRandomStartTime());

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/appointments/booking") &&
          res.request().method() === "POST"
      ),
      page.getByRole("button", { name: "Đặt lịch" }).click(),
    ]);

    // Backend trả 201 Created (@HttpCode(HttpStatus.CREATED) trên
    // AppointmentsController.createAppointment) khi tạo lịch hẹn thành công.
    expect(response.status()).toBe(201);

    // Không có toast success trong luồng này — dialog tự đóng
    // (closeAndReset) là tín hiệu UI duy nhất xác nhận thành công.
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("chặn submit khi thiếu thông tin bắt buộc của thân nhân mới", async ({
    page,
  }) => {
    await switchToNewRelativeMode(page);

    // Cố ý bỏ trống Họ và tên — vẫn là field bắt buộc của new_relative_profile
    // (fullname/relationship_code/gender bắt buộc; dob/phone tùy chọn, xem
    // BodyCreateRelativeDto ở backend) — useAutoBooking.ts phải chặn submit
    // ở client, không gọi API.
    await page
      .getByLabel("Mối quan hệ")
      .selectOption({ label: NEW_RELATIVE_RELATIONSHIP_LABEL });
    await page
      .getByLabel("Chuyên khoa")
      .selectOption({ label: SEED_SPECIALTY_NAME });
    await page.getByLabel("Giờ bắt đầu").fill(pickRandomStartTime());

    let bookingRequestFired = false;
    page.on("request", (req) => {
      if (req.url().includes("/appointments/booking")) {
        bookingRequestFired = true;
      }
    });

    await page.getByRole("button", { name: "Đặt lịch" }).click();
    await page.waitForTimeout(500);

    expect(bookingRequestFired).toBe(false);
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
