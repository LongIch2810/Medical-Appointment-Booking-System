import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, MessageSquarePlus, MessageSquareText, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PatientChatConversation } from "@/types/interface/patientChat.interface";

interface PatientChatConversationListProps {
  conversations: PatientChatConversation[];
  activeConversationId: number | null;
  isBusy: boolean;
  onNewConversation: () => void;
  onSelectConversation: (id: number) => void;
  onDeleteConversation?: (id: number) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
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
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: PatientChatConversationListProps) {
  const { t } = useTranslation();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !onLoadMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: "100px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

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
            <>
              {conversations.map((conversation) => {
                const isActive = activeConversationId === conversation.id;
                return (
                  <div
                    key={conversation.id}
                    className={`group relative flex items-center rounded-xl transition-colors ${
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
                      className="flex min-h-12 min-w-0 flex-1 items-center gap-2.5 rounded-xl py-2 pl-3.5 pr-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
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
                  </div>
                );
              })}

              {/* Sentinel element for infinite scroll */}
              <div ref={sentinelRef} className="h-2 w-full" aria-hidden="true" />

              {/* Loading spinner when fetching next page */}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-2.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  <span>Đang tải thêm...</span>
                </div>
              )}
            </>
          )}
        </nav>
      </ScrollArea>
    </div>
  );
}

