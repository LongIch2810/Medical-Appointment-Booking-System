import type { ReactNode } from "react";

import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import { Pagination } from "@/components/app/Pagination";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type GenericListColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
};

export type GenericListProps<T> = {
  title: string;
  description?: string;
  toolbar?: ReactNode;
  columns: GenericListColumn<T>[];
  rows: T[] | undefined;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  rowKey: (row: T) => string | number;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function GenericList<T>({
  title,
  description,
  toolbar,
  columns,
  rows,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  isLoading,
  isError,
  onRetry,
  rowKey,
  emptyTitle,
  emptyDescription,
}: GenericListProps<T>) {
  return (
    <Card className="rounded-3xl border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <CardHeader className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</CardTitle>
            {description ? (
              <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {toolbar}
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
              Tổng: {total}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {isLoading ? (
          <div className="p-8">
            <LoadingState />
          </div>
        ) : isError ? (
          <div className="p-8">
            <ErrorState onRetry={onRetry} />
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={emptyTitle ?? "Chưa có dữ liệu"}
              description={
                emptyDescription ??
                "Backend không trả về bản ghi nào cho bộ lọc hiện tại."
              }
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="mono-label px-4 py-3.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="align-middle transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800">
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function ActionCell({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1.5">{children}</div>;
}

