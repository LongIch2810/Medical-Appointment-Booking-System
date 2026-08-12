import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { EmptyState } from "@/components/app/EmptyState";
import { FilePreviewList } from "@/components/app/FilePreviewList";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ModuleConfig, ModuleRow, TableCell } from "@/types/app";

function renderCell(cell: TableCell) {
  if (typeof cell === "string") {
    return <span className="text-sm text-slate-700 dark:text-slate-300">{cell}</span>;
  }

  if (cell.tone) {
    return <Badge variant={cell.tone}>{cell.label}</Badge>;
  }

  return (
    <div>
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cell.label}</div>
      {cell.sublabel ? (
        <div className="text-xs text-slate-500 dark:text-slate-400">{cell.sublabel}</div>
      ) : null}
    </div>
  );
}

function RowDialog({ row }: { row: ModuleRow }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="rounded-full border border-[#212121] px-4 py-1.5 text-left text-xs font-medium text-[#212121] hover:bg-[#17171c] hover:text-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white transition">
          View details
        </button>
      </DialogTrigger>
      <DialogContent className="dark:border-slate-800 dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle className="dark:text-slate-100">{row.summary}</DialogTitle>
          <DialogDescription className="dark:text-slate-400">
            Chi tiết bản ghi và tệp đính kèm trong hệ thống.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          {row.meta.map((item) => (
            <div key={item.label} className="rounded-lg border border-[#d9d9dd] bg-[#f7f6f2] p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mono-label text-[10px] text-[#75758a] dark:text-slate-400">
                {item.label}
              </div>
              <div className="mt-1 text-sm font-medium text-[#212121] dark:text-slate-100">
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <FilePreviewList attachments={row.attachments} />
      </DialogContent>
    </Dialog>
  );
}

export function DataTable({ module }: { module: ModuleConfig }) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return module.rows;

    return module.rows.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(lower)
    );
  }, [module.rows, query]);

  return (
    <Card className="rounded-lg border-[#d9d9dd] dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base dark:text-slate-100">Danh sách dữ liệu</CardTitle>
            <span className="rounded-full bg-[#eeece7] px-2.5 py-0.5 text-xs font-medium text-[#75758a] dark:bg-slate-800 dark:text-slate-300">
              {rows.length} / {module.rows.length} bản ghi
            </span>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={module.searchPlaceholder}
              className="pl-9 pr-9 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {!rows.length ? (
          <div className="p-6">
            <EmptyState
              title={module.emptyTitle}
              description={module.emptyDescription}
            />
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto scrollbar-soft">
            <table className="min-w-full divide-y divide-[#d9d9dd] text-left dark:divide-slate-800">
              <thead className="sticky top-0 z-10 bg-[#f7f6f2] dark:bg-slate-950">
                <tr>
                  {module.columns.map((column) => (
                    <th
                      key={column.key}
                      className="mono-label px-4 py-3 text-[10px] font-medium text-[#75758a] dark:text-slate-400"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="mono-label px-4 py-3 text-[10px] font-medium text-[#75758a] dark:text-slate-400">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb] dark:divide-slate-800">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top transition-colors hover:bg-[#f7f6f2] dark:hover:bg-slate-800/60">
                    {module.columns.map((column) => (
                      <td key={column.key} className="px-4 py-3.5">
                        {renderCell(row.cells[column.key])}
                      </td>
                    ))}
                    <td className="px-4 py-3.5">
                      <RowDialog row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
