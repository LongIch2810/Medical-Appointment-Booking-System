import { useMemo, useState } from "react";
import {
  AlertCircle,
  MessageSquarePlus,
  MessagesSquare,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReportAssistantConversation } from "@/types/interface/adminReport.interface";

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return `Hôm nay, ${new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)}`;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function ReportAssistantConversationList({
  conversations,
  selectedId,
  isLoading,
  isError,
  onRetry,
  onSelect,
  onNew,
}: {
  conversations: ReportAssistantConversation[];
  selectedId: number | null;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelect: (id: number) => void;
  onNew: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-slate-900">
      {/* Header bar */}
      <div className="shrink-0 border-b border-slate-200/80 p-3 sm:p-3.5 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Hội thoại
            </h2>
            {conversations.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {conversations.length}
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg border-slate-200 px-2.5 text-xs font-semibold shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
            onClick={onNew}
            aria-label="Tạo hội thoại mới"
            title="Bắt đầu hội thoại phân tích mới"
          >
            <MessageSquarePlus
              aria-hidden="true"
              className="size-3.5 text-primary"
            />
            <span>Tạo mới</span>
          </Button>
        </div>

        {/* Search input when conversations count > 3 */}
        {conversations.length > 3 && (
          <div className="relative mt-2.5">
            <Search
              className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Tìm kiếm hội thoại…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm hội thoại"
              className="h-8 pl-8 pr-2.5 text-xs bg-slate-50/80 border-slate-200 dark:bg-slate-850 dark:border-slate-750"
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 p-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 animate-pulse dark:border-slate-800/80 dark:bg-slate-800/40"
            >
              <div className="h-3.5 w-3/4 rounded-md bg-slate-200 dark:bg-slate-700" />
              <div className="h-2.5 w-1/3 rounded-md bg-slate-200/70 dark:bg-slate-700/70" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-3">
          <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
            <AlertCircle
              className="size-5 text-destructive"
              aria-hidden="true"
            />
            <p className="mt-2 text-xs font-semibold text-destructive">
              Không tải được hội thoại
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              Vui lòng thử tải lại danh sách
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2.5 h-7.5 border-destructive/30 text-xs font-medium text-destructive hover:bg-destructive/10 cursor-pointer"
              onClick={onRetry}
            >
              Thử lại
            </Button>
          </div>
        </div>
      ) : filteredConversations.length ? (
        <nav
          aria-label="Danh sách các hội thoại báo cáo"
          className="scrollbar-soft min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2"
        >
          {filteredConversations.map((conversation) => {
            const isSelected = selectedId === conversation.id;
            return (
              <button
                key={conversation.id}
                type="button"
                aria-current={isSelected ? "page" : undefined}
                onClick={() => onSelect(conversation.id)}
                title={conversation.title}
                className={`group relative flex min-h-[3.5rem] w-full items-start gap-2.5 rounded-xl py-2.5 pl-3.5 pr-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                  isSelected
                    ? "border border-primary/30 bg-primary/8 text-primary shadow-2xs dark:bg-primary/15"
                    : "border border-transparent text-slate-700 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-slate-800/70"
                }`}
              >
                {isSelected && (
                  <span
                    className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
                <MessagesSquare
                  className={`mt-0.5 size-4 shrink-0 transition-colors ${
                    isSelected
                      ? "text-primary"
                      : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400"
                  }`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-xs sm:text-sm ${
                      isSelected
                        ? "font-bold text-slate-900 dark:text-slate-100"
                        : "font-medium text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {conversation.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-400 dark:text-slate-500">
                    {formatUpdatedAt(conversation.updatedAt)}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
      ) : searchQuery ? (
        <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>
            Không tìm thấy hội thoại nào phù hợp với &ldquo;{searchQuery}&rdquo;
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <MessagesSquare className="size-5" aria-hidden="true" />
          </div>
          <p className="mt-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            Chưa có hội thoại
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Bắt đầu bằng một câu hỏi về dữ liệu hệ thống.
          </p>
        </div>
      )}
    </div>
  );
}
