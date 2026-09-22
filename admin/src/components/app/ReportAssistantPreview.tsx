import { Download, ExternalLink, FileDown, FileText } from "lucide-react";
import { ChartConfigRenderer } from "@/components/app/ChartConfigRenderer";
import { GenericList } from "@/components/app/GenericList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportReportCsv } from "@/lib/exportReportCsv";
import { openBackendDocument } from "@/utils/open-backend-document";
import type { AdminReport } from "@/types/interface/adminReport.interface";

export function ReportAssistantPreview({ report }: { report: AdminReport }) {
  const content = report.report;
  const fileName = report.fileName || `bao-cao-hoi-thoai-${report.id}.pdf`;
  return (
    <div className="mt-3 space-y-3" aria-label="Bản xem trước báo cáo">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="size-5" aria-hidden="true" /></span>
          <div className="min-w-0"><p className="font-semibold text-slate-900 dark:text-slate-100">{content?.title || "Báo cáo AI"}</p><p className="text-sm text-slate-500 dark:text-slate-400">{report.rangeLabel}</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="min-h-11" disabled={!report.tableRows.length} onClick={() => exportReportCsv(fileName.replace(/\.pdf$/i, ".csv"), report.tableColumns, report.tableRows)}><FileDown aria-hidden="true" />Xuất CSV</Button>
          {report.pdfUrl ? <Button type="button" variant="outline" className="min-h-11" onClick={() => openBackendDocument(report.pdfUrl!)}><ExternalLink aria-hidden="true" />Mở PDF</Button> : null}
          {report.pdfUrl ? <Button type="button" variant="outline" className="min-h-11" onClick={() => openBackendDocument(report.pdfUrl!, true)}><Download aria-hidden="true" />Tải PDF</Button> : null}
        </div>
      </div>

      {content ? <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="p-4 pb-2"><CardTitle className="text-base">Phân tích</CardTitle></CardHeader>
        <CardContent className="space-y-4 p-4 pt-2">
          {content.insights.length ? <ul className="space-y-2">{content.insights.map((item, index) => <li key={index} className="rounded-xl bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100">{item}</li>)}</ul> : null}
          {content.analysis.map((item, index) => <section key={index}><h4 className="font-semibold text-slate-900 dark:text-slate-100">{item.section_title}</h4><p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.content}</p></section>)}
          {content.strategic_recommendations.length ? <section><h4 className="font-semibold text-slate-900 dark:text-slate-100">Khuyến nghị</h4><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">{content.strategic_recommendations.map((item, index) => <li key={index}>{item}</li>)}</ul></section> : null}
        </CardContent>
      </Card> : null}

      {report.chartConfig ? <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900"><CardHeader className="p-4 pb-2"><CardTitle className="text-base">Biểu đồ</CardTitle></CardHeader><CardContent className="p-4 pt-2"><ChartConfigRenderer chartConfig={report.chartConfig} /></CardContent></Card> : null}

      {report.tableRows.length ? <GenericList
        title="Dữ liệu truy vấn"
        description="Các dòng dữ liệu thực dùng để tạo báo cáo."
        columns={report.tableColumns.map((column) => ({ key: column.key, label: column.label, render: (row: Record<string, string | number>) => row[column.key] }))}
        rows={report.tableRows}
        total={report.tableRows.length}
        page={1}
        limit={report.tableRows.length}
        onPageChange={() => undefined}
        isLoading={false}
        isError={false}
        onRetry={() => undefined}
        rowKey={(row) => JSON.stringify(row)}
      /> : null}
    </div>
  );
}
