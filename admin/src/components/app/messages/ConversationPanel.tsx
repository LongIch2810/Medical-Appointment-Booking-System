import { type FC, type FormEvent, useEffect, useRef } from "react";
import { ChevronLeft, Send } from "lucide-react";

import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/interface/message.interface";

const NEAR_BOTTOM_THRESHOLD = 96;
const LOAD_OLDER_THRESHOLD = 40;

interface ConversationPanelProps {
  channelId: number | null;
  channelName: string | null;
  currentUserId?: number;
  messages: Message[];
  isLoadingMessages: boolean;
  isErrorMessages: boolean;
  onRetryMessages: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  onLoadOlder: () => void;
  messageText: string;
  onMessageTextChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSending: boolean;
  onRetryMessage: (message: Message) => void;
  onBack?: () => void;
  className?: string;
}

const ConversationPanel: FC<ConversationPanelProps> = ({
  channelId,
  channelName,
  currentUserId,
  messages,
  isLoadingMessages,
  isErrorMessages,
  onRetryMessages,
  hasNextPage,
  isFetchingNextPage,
  onLoadOlder,
  messageText,
  onMessageTextChange,
  onSubmit,
  isSending,
  onRetryMessage,
  onBack,
  className,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasNearBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(0);
  const prevMessageCountRef = useRef(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
    wasNearBottomRef.current = true;
    prevMessageCountRef.current = messages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (messages.length > prevMessageCountRef.current && wasNearBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    wasNearBottomRef.current = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;

    if (
      container.scrollTop < LOAD_OLDER_THRESHOLD &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      prevScrollHeightRef.current = container.scrollHeight;
      onLoadOlder();
    }
  };

  useEffect(() => {
    if (isFetchingNextPage) return;
    const container = scrollRef.current;
    if (!container || !prevScrollHeightRef.current) return;
    container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
    prevScrollHeightRef.current = 0;
  }, [isFetchingNextPage, messages]);

  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden",
        className,
      )}
    >
      {channelId ? (
        <>
          {onBack && (
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 px-3 py-2.5 lg:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={onBack}
                aria-label="Quay lại danh sách hội thoại"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                {channelName ?? `Hội thoại #${channelId}`}
              </span>
            </div>
          )}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            aria-live="polite"
            aria-relevant="additions"
            className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-soft"
          >
            {isFetchingNextPage && (
              <div className="flex justify-center pb-2">
                <LoadingState size="sm" minHeight="min-h-0" />
              </div>
            )}
            {isLoadingMessages ? (
              <LoadingState />
            ) : isErrorMessages ? (
              <div className="flex h-full items-center justify-center">
                <ErrorState
                  title="Không thể tải tin nhắn"
                  description="Đã có lỗi xảy ra khi tải lịch sử trò chuyện."
                  onRetry={onRetryMessages}
                />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  title="Chưa có tin nhắn"
                  description="Hãy bắt đầu trao đổi với bệnh nhân."
                />
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender.id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-2xs leading-relaxed",
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs",
                        msg.isOptimistic && "opacity-70",
                        msg.failed && "border border-rose-300 bg-rose-50 text-rose-700",
                      )}
                    >
                      {!isMine ? (
                        <p className="mb-1 text-[10px] font-bold text-primary dark:text-emerald-400">
                          {msg.sender.fullname}
                        </p>
                      ) : null}
                      <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                        {msg.content}
                      </p>
                      <div
                        className={cn(
                          "mt-1.5 text-[10px] text-right font-medium",
                          isMine && !msg.failed
                            ? "text-primary-foreground/75"
                            : "text-slate-400 dark:text-slate-400",
                        )}
                      >
                        {msg.failed ? (
                          <button
                            type="button"
                            onClick={() => onRetryMessage(msg)}
                            className="font-bold text-rose-600 underline decoration-dotted underline-offset-2"
                          >
                            Gửi thất bại, nhấn để thử lại
                          </button>
                        ) : msg.isOptimistic ? (
                          <span>Đang gửi...</span>
                        ) : (
                          <span>{msg.created_at}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="sticky bottom-0 border-t border-slate-100 dark:border-slate-800 p-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] bg-slate-50/50 dark:bg-slate-950/40">
            <form onSubmit={onSubmit} className="flex gap-2">
              <Input
                placeholder="Nhập tin nhắn tư vấn hoặc trao đổi chuyên môn..."
                aria-label="Nhập tin nhắn"
                value={messageText}
                onChange={(e) => onMessageTextChange(e.target.value)}
                className="flex-1 rounded-xl"
              />
              <Button
                type="submit"
                size="default"
                aria-label="Gửi tin nhắn"
                disabled={!messageText.trim() || isSending}
                className="rounded-xl font-bold shadow-xs px-4"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400">
            Vui lòng chọn một cuộc hội thoại từ danh sách bên trái.
          </p>
        </div>
      )}
    </div>
  );
};

export default ConversationPanel;
