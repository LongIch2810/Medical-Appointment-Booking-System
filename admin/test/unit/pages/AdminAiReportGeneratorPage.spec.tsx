import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/configs/axios";
import { AdminAiReportGeneratorPage } from "@/pages/AdminAiReportGeneratorPage";

vi.mock("@/configs/axios", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  backendOrigin: "http://localhost:3000",
  getBackendBaseURL: () => "http://localhost:3000",
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AdminAiReportGeneratorPage />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("AdminAiReportGeneratorPage", () => {
  it("exposes exactly nine report types and five date presets", () => {
    renderPage();

    const [reportTypeSelect, rangePresetSelect] = screen.getAllByRole(
      "combobox",
    ) as HTMLSelectElement[];

    expect(
      Array.from(reportTypeSelect.options).map((option) => option.value),
    ).toEqual([
      "BOOKING_CANCELLATION_NOSHOW",
      "PATIENT_FLOW_BY_TIMESLOT",
      "APPOINTMENTS_BY_SPECIALTY",
      "DOCTOR_FILL_RATE",
      "NEW_USER_REGISTRATIONS",
      "USER_DEMOGRAPHICS",
      "AI_COACH_ACTIVITY",
      "HEALTH_GOAL_SUMMARY",
      "HEALTH_TRENDS",
    ]);
    expect(
      Array.from(rangePresetSelect.options).map((option) => option.value),
    ).toEqual(["TODAY", "THIS_WEEK", "THIS_MONTH", "THIS_YEAR", "CUSTOM"]);
  });

  it("does not call the API for a missing or reversed custom range", async () => {
    const user = userEvent.setup();
    renderPage();
    const [, rangePresetSelect] = screen.getAllByRole(
      "combobox",
    ) as HTMLSelectElement[];

    await user.selectOptions(rangePresetSelect, "CUSTOM");
    const dateInputs = screen.getAllByDisplayValue("") as HTMLInputElement[];
    expect(dateInputs).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /Tạo Báo cáo AI/ }));
    expect(screen.getByText("Vui lòng chọn đủ khoảng ngày.")).toBeInTheDocument();
    expect(axiosInstance.post).not.toHaveBeenCalled();

    fireEvent.change(dateInputs[0], { target: { value: "2026-10-31" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-05-01" } });
    await user.click(screen.getByRole("button", { name: /Tạo Báo cáo AI/ }));

    expect(
      screen.getByText("Ngày bắt đầu phải trước ngày kết thúc."),
    ).toBeInTheDocument();
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });
});
