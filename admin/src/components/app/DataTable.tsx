import { useMemo, useState } from "react";
import { Search } from "lucide-react";

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
    return <span className="text-sm text-slate-700">{cell}</span>;
  }

  if (cell.tone) {
    return <Badge variant={cell.tone}>{cell.label}</Badge>;
  }

  return (
    <div>
      <div className="text-sm font-semibold text-slate-900">{cell.label}</div>
      {cell.sublabel ? (
        <div className="text-xs text-slate-500">{cell.sublabel}</div>
      ) : null}
    </div>
  );
}

function RowDialog({ row }: { row: ModuleRow }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="rounded-full border border-[#212121] px-4 py-2 text-left text-xs font-medium text-[#212121] hover:bg-[#17171c] hover:text-white">
          View details
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{row.summary}</DialogTitle>
          <DialogDescription>
            Mock metadata prepared for the detail panel after the real API is connected.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          {row.meta.map((item) => (
            <div key={item.label} className="rounded-lg border border-[#d9d9dd] bg-[#f7f6f2] p-4">
              <div className="mono-label text-[10px] text-[#75758a]">
                {item.label}
              </div>
              <div className="mt-1 text-sm font-medium text-[#212121]">
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

  if (!rows.length) {
    return (
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={module.searchPlaceholder}
            className="pl-9"
          />
        </div>
        <EmptyState
          title={module.emptyTitle}
          description={module.emptyDescription}
        />
      </div>
    );
  }

  return (
      <Card className="rounded-lg border-[#d9d9dd]">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-base">Mock data list</CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={module.searchPlaceholder}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#d9d9dd] text-left">
          <thead>
            <tr>
              {module.columns.map((column) => (
                <th
                  key={column.key}
                  className="mono-label px-3 py-3 text-[10px] font-medium text-[#75758a]"
                >
                  {column.label}
                </th>
              ))}
              <th className="mono-label px-3 py-3 text-[10px] font-medium text-[#75758a]">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {rows.map((row) => (
              <tr key={row.id} className="align-top transition-colors hover:bg-[#f7f6f2]">
                {module.columns.map((column) => (
                  <td key={column.key} className="px-3 py-4">
                    {renderCell(row.cells[column.key])}
                  </td>
                ))}
                <td className="px-3 py-4">
                  <RowDialog row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
