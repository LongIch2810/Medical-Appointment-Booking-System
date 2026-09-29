import {
  formatAdminReportCell,
  localizeAdminReportTable,
} from "@/lib/formatAdminReportTable";

describe("localizeAdminReportTable", () => {
  it("localizes known report headers and weekday values", () => {
    const result = localizeAdminReportTable(
      [
        { key: "start_time", label: "Start Time" },
        { key: "day_of_week", label: "Day Of Week" },
        { key: "total_appointments", label: "Total Appointments" },
      ],
      [{ start_time: "08:00", day_of_week: 1, total_appointments: 4 }],
    );

    expect(result.columns).toEqual([
      { key: "start_time", label: "Giờ bắt đầu" },
      { key: "day_of_week", label: "Ngày trong tuần" },
      { key: "total_appointments", label: "Tổng số lịch khám" },
    ]);
    expect(result.rows).toEqual([
      { start_time: "08:00", day_of_week: "Thứ hai", total_appointments: 4 },
    ]);
  });

  it("supports numeric weekday strings and preserves unknown data", () => {
    expect(formatAdminReportCell("day_of_week", "0")).toBe("Chủ nhật");
    expect(formatAdminReportCell("day_of_week", "6")).toBe("Thứ bảy");
    expect(formatAdminReportCell("day_of_week", "unknown")).toBe("unknown");

    const result = localizeAdminReportTable(
      [{ key: "custom_metric", label: "Custom Metric" }],
      [{ custom_metric: 12 }],
    );
    expect(result).toEqual({
      columns: [{ key: "custom_metric", label: "Custom Metric" }],
      rows: [{ custom_metric: 12 }],
    });
  });
});
