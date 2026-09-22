import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquarePlus, MessageSquareText, MessagesSquare, Trash2 } from "lucide-react";
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
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

export default function PatientChatConversationList({
  conversations,
  activeConversationId,
  isBusy,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: PatientChatConversationListProps) {
  const { t } = useTranslation();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="border-b border-border/80 p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-sm font-bold text-foreground">
              {t("chatbot.conversationsTitle")}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {t("chatbot.conversationsDesc")}
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="mt-3 min-h-11 w-full justify-start gap-2 rounded-xl font-bold text-primary-foreground shadow-2xs cursor-pointer"
          onClick={onNewConversation}
          disabled={isBusy}
        >
          <MessageSquarePlus className="size-4" aria-hidden="true" />
          <span>{t("chatbot.newConversation")}</span>
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav aria-label={t("chatbot.conversationsTitle")} className="space-y-1 p-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <MessagesSquare className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-2.5 text-xs font-medium text-muted-foreground">
                {t("chatbot.noConversations")}
              </p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const isActive = activeConversationId === conversation.id;
              return (
                <div
                  key={conversation.id}
                  className={`group relative flex items-center gap-1 rounded-xl transition-colors ${
                    isActive
                      ? "border border-primary/30 bg-primary/8 text-primary font-semibold"
                      : "border border-transparent hover:bg-muted/70 text-foreground"
                  }`}
                >
                  {isActive && (
                    <span
                      className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    className="flex min-h-12 min-w-0 flex-1 items-center gap-2.5 rounded-lg py-2 pl-3.5 pr-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                    aria-current={isActive ? "page" : undefined}
                    disabled={isBusy}
                    title={conversation.title || t("chatbot.newConversation")}
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <MessageSquareText
                      className={`size-4 shrink-0 ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs sm:text-sm font-semibold text-foreground">
                        {conversation.title || t("chatbot.newConversation")}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground font-normal">
                        {formatUpdatedDate(conversation.updatedAt)}
                      </span>
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0 text-muted-foreground opacity-70 hover:opacity-100 hover:text-destructive cursor-pointer"
                    aria-label={`Xóa cuộc trò chuyện: ${conversation.title || "Cuộc trò chuyện"}`}
                    disabled={isBusy}
                    onClick={() => setDeletingId(conversation.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })
          )}
        </nav>
      </ScrollArea>

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">
              {t("chatbot.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {t("chatbot.deleteConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="min-h-11 rounded-xl">
              {t("chatbot.cancelBtn")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11 rounded-xl bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deletingId !== null) onDeleteConversation(deletingId);
                setDeletingId(null);
              }}
            >
              {t("chatbot.deleteBtn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

