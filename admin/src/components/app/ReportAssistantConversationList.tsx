import { MessageSquarePlus, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/app/LoadingState";
import { ErrorState } from "@/components/app/ErrorState";
import type { ReportAssistantConversation } from "@/types/interface/adminReport.interface";

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
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
  return <div className="flex h-full min-h-0 flex-col bg-white dark:bg-slate-900">
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-4 dark:border-slate-800">
      <div><h2 className="font-semibold text-slate-900 dark:text-slate-100">Hội thoại</h2><p className="text-xs text-slate-500 dark:text-slate-400">Chỉ bạn xem được</p></div>
      <Button type="button" variant="outline" size="icon" className="size-11 shrink-0" aria-label="Tạo hội thoại mới" onClick={onNew}><MessageSquarePlus aria-hidden="true" /></Button>
    </div>
    {isLoading ? <div className="p-4"><LoadingState size="sm" /></div> : isError ? <div className="p-4"><ErrorState description="Không tải được danh sách hội thoại." onRetry={onRetry} /></div> : conversations.length ? <nav aria-label="Các hội thoại báo cáo" className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
      {conversations.map((conversation) => <button key={conversation.id} type="button" aria-current={selectedId === conversation.id ? "page" : undefined} onClick={() => onSelect(conversation.id)} className={`min-h-14 w-full rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selectedId === conversation.id ? "bg-primary/10 text-primary" : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
        <span className="flex items-start gap-2.5"><MessagesSquare className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{conversation.title}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{formatUpdatedAt(conversation.updatedAt)}</span></span></span>
      </button>)}
    </nav> : <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center"><MessagesSquare className="size-8 text-slate-300 dark:text-slate-600" aria-hidden="true" /><p className="mt-3 font-medium text-slate-800 dark:text-slate-200">Chưa có hội thoại</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Bắt đầu bằng một câu hỏi về hoạt động của hệ thống.</p></div>}
  </div>;
}
