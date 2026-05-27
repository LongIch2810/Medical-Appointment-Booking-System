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
    <Card className="rounded-lg border-[#d9d9dd]">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? (
              <span className="text-xs text-[#75758a]">{description}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {toolbar}
            <Badge variant="outline">Tổng: {total}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 overflow-x-auto">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={onRetry} />
        ) : !rows || rows.length === 0 ? (
          <EmptyState
            title={emptyTitle ?? "Chưa có dữ liệu"}
            description={
              emptyDescription ??
              "Backend không trả về bản ghi nào cho bộ lọc hiện tại."
            }
          />
        ) : (
          <table className="min-w-full divide-y divide-[#d9d9dd] text-left">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="mono-label px-3 py-3 text-[10px] font-medium text-[#75758a]"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="align-top transition-colors hover:bg-[#f7f6f2]"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-3 py-4 text-sm text-[#212121]"
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      </CardContent>
    </Card>
  );
}

export function ActionCell({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}
