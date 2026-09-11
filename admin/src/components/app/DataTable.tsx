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
        <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-primary/40 dark:hover:bg-primary/10 transition-all cursor-pointer">
          Xem chi tiết
        </button>
      </DialogTrigger>
      <DialogContent className="dark:border-slate-800 dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle className="dark:text-slate-100 font-bold text-slate-900">{row.summary}</DialogTitle>
          <DialogDescription className="dark:text-slate-400 text-slate-500">
            Chi tiết bản ghi và tệp đính kèm trong hệ thống.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain pr-1 scrollbar-soft space-y-4 pt-2">
          <div className="grid gap-3 md:grid-cols-2">
            {row.meta.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {item.label}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          <FilePreviewList attachments={row.attachments} />
        </div>
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
    <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="space-y-4 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">Danh sách dữ liệu</CardTitle>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {rows.length} / {module.rows.length} bản ghi
            </span>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={module.searchPlaceholder}
              className="pl-9 pr-9 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
            <table className="min-w-full divide-y divide-slate-100 text-left dark:divide-slate-800">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-xs dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  {module.columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {rows.map((row) => (
                  <tr key={row.id} className="align-middle transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
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
