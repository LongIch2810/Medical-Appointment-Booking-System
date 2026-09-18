import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import DialogAutoBooking from "@/components/dialog/DialogAutoBooking";
import * as appointmentApi from "@/api/appointmentApi";

vi.mock("@/store/useUserStore", () => ({
  useUserStore: () => ({
    userInfo: { id: 1, fullname: "Nguyễn Văn A", email: "a@example.com" },
  }),
}));

vi.mock("@/hooks/usePatientPortalApi", () => ({
  usePatientRelatives: () => ({
    data: {
      data: {
        relatives: [
          {
            id: 1,
            fullname: "Nguyễn Văn A",
            relationship: { relationship_name: "Bản thân" },
          },
          {
            id: 2,
            fullname: "Trần Thị Mẹ",
            relationship: { relationship_name: "Mẹ" },
          },
        ],
      },
    },
    isLoading: false,
  }),
  useRelationships: () => ({
    data: {
      data: {
        relationships: [
          { relationship_code: "FATHER", relationship_name: "Bố" },
          { relationship_code: "MOTHER", relationship_name: "Mẹ" },
        ],
      },
    },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useGetSpecialtiesInfinite", () => ({
  useGetSpecialtiesInfinite: () => ({
    data: {
      pages: [
        {
          data: {
            specialties: [
              { id: 10, name: "Tim mạch" },
              { id: 20, name: "Nhi khoa" },
            ],
          },
        },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock("@/api/appointmentApi", () => ({
  bookingAutoAppointment: vi.fn(),
}));

describe("DialogAutoBooking Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mở modal khi bấm nút Đặt lịch nhanh", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DialogAutoBooking />);

    const openButton = screen.getByRole("button", { name: /Đặt lịch nhanh/i });
    await user.click(openButton);

    expect(
      await screen.findByRole("heading", { name: "Đặt lịch nhanh" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Chọn ngày và khoảng thời gian thuận tiện\. LifeHealth sẽ tự tìm bác sĩ cùng ca khám còn phù hợp\./i
      )
    ).toBeInTheDocument();
  });

  it("CTA 'Tìm ca khám phù hợp' bị disabled khi chưa chọn đủ dữ liệu bắt buộc (người khám/chuyên khoa)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DialogAutoBooking />);

    const openBtn = screen.getByRole("button", { name: /Đặt lịch nhanh/i });
    await user.click(openBtn);

    const submitBtn = await screen.findByRole("button", {
      name: /Tìm ca khám phù hợp/i,
    });
    // Ban đầu relative_id = 0, specialty_id = 0 nên form chưa valid
    expect(submitBtn).toBeDisabled();
  });

  it("chọn người khám và chuyên khoa kích hoạt nút submit hợp lệ", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DialogAutoBooking />);

    await user.click(screen.getByRole("button", { name: /Đặt lịch nhanh/i }));

    // Chọn người khám
    const patientSelect = await screen.findByLabelText(/1\. Người đi khám/i);
    await user.selectOptions(patientSelect, "1");

    // Chọn chuyên khoa
    const specialtySelect = screen.getByLabelText(/2\. Chuyên khoa khám/i);
    await user.selectOptions(specialtySelect, "10");

    // Nút submit hợp lệ
    const submitBtn = screen.getByRole("button", {
      name: /Tìm ca khám phù hợp/i,
    });
    expect(submitBtn).toBeEnabled();

    // Kiểm tra dòng tóm tắt xuất hiện
    expect(
      screen.getByLabelText(/Tóm tắt thông tin đặt lịch/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Nguyễn Văn A · Tim mạch/i)
    ).toBeInTheDocument();
  });

  it("chuyển sang 'Tự chọn giờ' hiển thị 2 trường thời gian 'Từ khoảng' và 'Đến khoảng'", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DialogAutoBooking />);

    await user.click(screen.getByRole("button", { name: /Đặt lịch nhanh/i }));

    // Ban đầu chọn preset Buổi sáng, chưa có trường nhập giờ tự do
    expect(screen.queryByLabelText(/Từ khoảng/i)).not.toBeInTheDocument();

    // Bấm chọn preset "Tự chọn giờ"
    const customPresetBtn = screen.getByRole("radio", {
      name: /Tự chọn giờ/i,
    });
    await user.click(customPresetBtn);
    expect(customPresetBtn).toHaveAttribute("aria-checked", "true");

    // Hiển thị 2 ô nhập giờ
    expect(screen.getByLabelText(/Từ khoảng/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Đến khoảng \(tùy chọn\)/i)).toBeInTheDocument();
  });

  it("hiển thị lỗi inline khi end_time <= start_time trong chế độ tự chọn giờ", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DialogAutoBooking />);

    await user.click(screen.getByRole("button", { name: /Đặt lịch nhanh/i }));

    // Chọn người khám & chuyên khoa
    await user.selectOptions(
      screen.getByLabelText(/1\. Người đi khám/i),
      "1"
    );
    await user.selectOptions(
      screen.getByLabelText(/2\. Chuyên khoa khám/i),
      "10"
    );

    // Chọn Tự chọn giờ
    await user.click(screen.getByRole("radio", { name: /Tự chọn giờ/i }));

    const startInput = screen.getByLabelText(/Từ khoảng/i);
    const endInput = screen.getByLabelText(/Đến khoảng \(tùy chọn\)/i);

    fireEvent.change(startInput, { target: { value: "15:00" } });
    fireEvent.change(endInput, { target: { value: "10:00" } });

    await waitFor(() => {
      expect(
        screen.getByText("Giờ kết thúc phải lớn hơn giờ bắt đầu")
      ).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", {
      name: /Tìm ca khám phù hợp/i,
    });
    expect(submitBtn).toBeDisabled();
  });

  it("mở và đóng form thêm người thân mới mượt mà, không làm mất thông tin chuyên khoa đã chọn", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DialogAutoBooking />);

    await user.click(screen.getByRole("button", { name: /Đặt lịch nhanh/i }));

    // Chọn chuyên khoa trước
    await user.selectOptions(
      screen.getByLabelText(/2\. Chuyên khoa khám/i),
      "20"
    );

    // Bấm "+ Thêm người mới"
    const toggleNewRelativeBtn = screen.getByRole("button", {
      name: /\+ Thêm người mới/i,
    });
    await user.click(toggleNewRelativeBtn);

    // Kiểm tra hiển thị form người thân mới
    expect(screen.getByText("Hồ sơ người thân mới")).toBeInTheDocument();
    expect(screen.getByLabelText(/Họ và tên/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mối quan hệ/i)).toBeInTheDocument();

    // Điền thông tin người thân mới
    await user.type(screen.getByLabelText(/Họ và tên/i), "Bé Nguyễn C");
    await user.selectOptions(screen.getByLabelText(/Mối quan hệ/i), "FATHER");

    // Chuyên khoa đã chọn vẫn giữ nguyên giá trị (20 = Nhi khoa)
    const specialtySelect = screen.getByLabelText(
      /2\. Chuyên khoa khám/i
    ) as HTMLSelectElement;
    expect(specialtySelect.value).toBe("20");

    // Bấm nút Quay lại trong disclosure form
    const cancelNewBtn = screen.getByRole("button", {
      name: /Quay lại danh sách người thân/i,
    });
    await user.click(cancelNewBtn);

    // Quay lại dropdown người có sẵn và chuyên khoa vẫn giữ nguyên
    expect(
      screen.getByLabelText(/1\. Người đi khám/i)
    ).toBeInTheDocument();
    expect(specialtySelect.value).toBe("20");
  });

  it("khi API trả lỗi 409 slot unavailable, modal hiển thị thông báo inline và không đóng form", async () => {
    const mockedBooking = vi.mocked(appointmentApi.bookingAutoAppointment);
    mockedBooking.mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          message:
            "Không tìm thấy bác sĩ/ca khám phù hợp còn trống trong khung giờ yêu cầu.",
        },
      },
    });

    const user = userEvent.setup();
    renderWithProviders(<DialogAutoBooking />);

    await user.click(screen.getByRole("button", { name: /Đặt lịch nhanh/i }));

    await user.selectOptions(
      screen.getByLabelText(/1\. Người đi khám/i),
      "1"
    );
    await user.selectOptions(
      screen.getByLabelText(/2\. Chuyên khoa khám/i),
      "10"
    );

    const submitBtn = screen.getByRole("button", {
      name: /Tìm ca khám phù hợp/i,
    });
    await user.click(submitBtn);

    // Hiển thị lỗi inline trong modal
    expect(
      await screen.findByText("Chưa tìm thấy ca phù hợp")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Chưa tìm thấy ca phù hợp trong khoảng thời gian này\. Vui lòng chọn ngày hoặc khoảng thời gian khác và thử lại\./i
      )
    ).toBeInTheDocument();

    // Modal vẫn mở và dữ liệu vẫn được bảo toàn
    expect(
      screen.getByRole("heading", { name: "Đặt lịch nhanh" })
    ).toBeInTheDocument();
    const specialtySelect = screen.getByLabelText(
      /2\. Chuyên khoa khám/i
    ) as HTMLSelectElement;
    expect(specialtySelect.value).toBe("10");
  });

  it("bấm nút Hủy đóng modal và reset sạch trạng thái", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DialogAutoBooking />);

    await user.click(screen.getByRole("button", { name: /Đặt lịch nhanh/i }));

    const cancelBtn = screen.getByRole("button", { name: "Hủy" });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Đặt lịch nhanh" })
      ).not.toBeInTheDocument();
    });
  });
});
