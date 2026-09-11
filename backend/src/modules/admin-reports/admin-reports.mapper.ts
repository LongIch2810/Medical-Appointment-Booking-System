import { plainToInstance } from 'class-transformer';
import { AdminReportResponseDto } from './dto/response/adminReportResponse.dto';
import { ReportType } from './dto/request/bodyGenerateAdminReport.dto';

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseTableRows(rawResult: unknown): Record<string, string | number>[] {
  if (typeof rawResult !== 'string') return [];
  try {
    const parsed = JSON.parse(rawResult);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export class AdminReportsMapper {
  static toResponse(
    reportType: ReportType,
    rangeLabel: string,
    chatbotData:
      { pdfUrl?: string | null; raw?: Record<string, any> } | undefined,
  ): AdminReportResponseDto {
    const raw = chatbotData?.raw ?? {};
    const tableRows = parseTableRows(raw.result);
    const tableColumns = tableRows.length
      ? Object.keys(tableRows[0]).map((key) => ({
          key,
          label: humanizeKey(key),
        }))
      : [];

    return plainToInstance(
      AdminReportResponseDto,
      {
        reportType,
        rangeLabel,
        pdfUrl: chatbotData?.pdfUrl ?? null,
        report: raw.report ?? null,
        chartConfig: raw.chartConfig ?? null,
        tableColumns,
        tableRows,
      },
      { excludeExtraneousValues: true },
    );
  }
}
