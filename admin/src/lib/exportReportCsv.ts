import type { AdminReportTableColumn } from "@/types/interface/adminReport.interface";

const CSV_BOM = String.fromCharCode(0xfeff);

function escapeCsvValue(value: unknown): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportReportCsv(
  filename: string,
  columns: AdminReportTableColumn[],
  rows: Record<string, string | number>[],
) {
  if (columns.length === 0 || rows.length === 0) return;

  const header = columns.map((col) => escapeCsvValue(col.label)).join(",");
  const lines = rows.map((row) =>
    columns.map((col) => escapeCsvValue(row[col.key])).join(","),
  );
  const csvContent = [header, ...lines].join("\n");

  // BOM đầu file để Excel nhận đúng UTF-8 (giữ dấu tiếng Việt) khi mở CSV.
  const blob = new Blob([CSV_BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
