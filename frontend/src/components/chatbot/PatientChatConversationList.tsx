import { useState } from "react";
import { MessageSquareText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PatientChatConversation } from "@/types/interface/patientChat.interface";

interface PatientChatConversationListProps {
  conversations: PatientChatConversation[];
  activeConversationId: number | null;
  isBusy: boolean;
  onNewConversation: () => void;
  onSelectConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
}

function formatUpdatedDate(value: string) {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN");
}

export default function PatientChatConversationList({
  conversations,
  activeConversationId,
  isBusy,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: PatientChatConversationListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border p-4">
        <h2 className="font-heading text-base font-bold text-foreground">Cuộc trò chuyện</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Mỗi cuộc trò chuyện có ngữ cảnh riêng.
        </p>
        <Button
          type="button"
          className="mt-4 h-11 w-full justify-start"
          onClick={onNewConversation}
          disabled={isBusy}
        >
          <Plus className="size-4" />
          Cuộc trò chuyện mới
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav aria-label="Danh sách cuộc trò chuyện" className="space-y-1 p-2">
          {conversations.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Chưa có cuộc trò chuyện nào.
            </p>
          ) : conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`flex items-center gap-1 rounded-xl border p-1 ${
                activeConversationId === conversation.id
                  ? "border-primary/30 bg-primary/5"
                  : "border-transparent hover:bg-muted/70"
              }`}
            >
              <button
                type="button"
                className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-current={activeConversationId === conversation.id ? "page" : undefined}
                disabled={isBusy}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <MessageSquareText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {conversation.title || "Cuộc trò chuyện mới"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {formatUpdatedDate(conversation.updatedAt)}
                  </span>
                </span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Xóa cuộc trò chuyện ${conversation.title}`}
                disabled={isBusy}
                onClick={() => setDeletingId(conversation.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa cuộc trò chuyện?</AlertDialogTitle>
            <AlertDialogDescription>
              Lịch sử trong cuộc trò chuyện này sẽ được ẩn khỏi tài khoản của bạn. Sở thích đã ghi nhớ không bị ảnh hưởng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Giữ lại</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11 bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deletingId !== null) onDeleteConversation(deletingId);
                setDeletingId(null);
              }}
            >
              Xóa cuộc trò chuyện
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
