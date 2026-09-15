import { type FC, type FormEvent, useEffect, useRef } from "react";
import { ChevronLeft, SendHorizontal, Stethoscope } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loading from "@/components/loading/Loading";
import ErrorState from "@/components/notification/ErrorState";
import NotFoundResult from "@/components/notification/NotFoundResult";
import { cn } from "@/lib/utils";
import type { Channel, Message } from "@/types/interface/patient.interface";
import {
  getDoctorAvatar,
  getDoctorDisplayName,
  getDoctorInitial,
  getDoctorSubtitle,
} from "./messageHelpers";
import MessageBubble from "./MessageBubble";
import { useTranslation } from "react-i18next";

const NEAR_BOTTOM_THRESHOLD = 96;
const LOAD_OLDER_THRESHOLD = 40;

interface ChatPanelProps {
  channel: Channel | null;
  currentUserId?: number;
  activeChannelId: number;
  messages: Message[];
  isLoadingMessages: boolean;
  isErrorMessages: boolean;
  onRetryMessages: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  onLoadOlder: () => void;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSending: boolean;
  onRetryMessage: (message: Message) => void;
  onBack?: () => void;
  className?: string;
}

const ChatPanel: FC<ChatPanelProps> = ({
  channel,
  currentUserId,
  activeChannelId,
  messages,
  isLoadingMessages,
  isErrorMessages,
  onRetryMessages,
  hasNextPage,
  isFetchingNextPage,
  onLoadOlder,
  draft,
  onDraftChange,
  onSubmit,
  isSending,
  onRetryMessage,
  onBack,
  className,
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasNearBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(0);
  const prevMessageCountRef = useRef(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    // Đổi hội thoại: luôn cuộn xuống đáy để bắt đầu ở tin mới nhất.
    container.scrollTop = container.scrollHeight;
    wasNearBottomRef.current = true;
    prevMessageCountRef.current = messages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannelId]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (messages.length > prevMessageCountRef.current) {
      // Chỉ tự cuộn xuống khi người dùng đang ở gần đáy — tránh giật người
      // dùng đang đọc lịch sử phía trên khi có tin mới đến qua realtime.
      if (wasNearBottomRef.current) {
        container.scrollTop = container.scrollHeight;
      }
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
    const newScrollHeight = container.scrollHeight;
    container.scrollTop = newScrollHeight - prevScrollHeightRef.current;
    prevScrollHeightRef.current = 0;
  }, [isFetchingNextPage, messages]);

  return (
    <div className={cn("flex flex-col bg-white dark:bg-[#172033]", className)}>
      <div className="flex items-center gap-3.5 border-b border-slate-100 dark:border-[#293548] p-4.5 bg-slate-50/30 dark:bg-[#111827]">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden -ml-1.5 shrink-0 rounded-xl"
            onClick={onBack}
            aria-label={t("common.back")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar className="h-11 w-11 border-2 border-primary/20 dark:border-primary/40 shadow-2xs shrink-0">
          <AvatarImage
            src={getDoctorAvatar(channel, currentUserId) ?? ""}
            alt={getDoctorDisplayName(channel, currentUserId)}
            className="object-cover"
          />
          <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-sm font-bold text-primary dark:text-sky-300">
            {channel ? (
              getDoctorInitial(channel, currentUserId)
            ) : (
              <Stethoscope className="h-5 w-5" />
            )}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F1F5F9] truncate">
            {channel ? `${t("appointments.doctorPrefix")} ` : ""}
            {getDoctorDisplayName(channel, currentUserId)}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
              aria-hidden="true"
            />
            <p className="text-xs font-semibold text-primary dark:text-sky-400">
              {getDoctorSubtitle(channel)}
            </p>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 space-y-3.5 overflow-y-auto bg-slate-50/70 dark:bg-[#0B1220]/60 p-5"
      >
        {isFetchingNextPage && (
          <div className="flex justify-center pb-2">
            <Loading size={18} />
          </div>
        )}
        {isLoadingMessages ? (
          <div className="flex h-full items-center justify-center">
            <Loading size={28} />
          </div>
        ) : isErrorMessages ? (
          <ErrorState
            title={t("common.error")}
            description="Error loading messages."
            onRetry={onRetryMessages}
          />
        ) : !activeChannelId ? (
          <NotFoundResult
            title={t("messages.noConversationSelectedTitle")}
            description={t("messages.selectChannelPrompt")}
          />
        ) : messages.length === 0 ? (
          <NotFoundResult
            title={t("messages.emptyConversationTitle")}
            description={t("messages.emptyConversationDesc")}
          />
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isMine={message.sender.id === currentUserId}
              onRetry={onRetryMessage}
            />
          ))
        )}
      </div>

      <form
        className="sticky bottom-0 border-t border-slate-100 dark:border-[#293548] bg-white dark:bg-[#111827] p-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))]"
        onSubmit={onSubmit}
      >
        <div className="flex items-center gap-2.5">
          <Input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder={t("messages.inputPlaceholder")}
            aria-label={t("messages.inputPlaceholder")}
            disabled={!activeChannelId}
            className="h-10.5 rounded-2xl border-slate-200 bg-slate-50/60 text-xs sm:text-sm shadow-none focus-visible:bg-white dark:border-[#293548] dark:bg-[#1E293B] dark:text-[#F1F5F9] dark:focus-visible:bg-[#1E293B]"
          />
          <Button
            type="submit"
            aria-label={t("messages.sendBtn")}
            className="h-10.5 px-4.5 rounded-2xl gap-2 !bg-primary hover:!bg-primary/90 !text-primary-foreground font-bold text-xs shadow-xs shrink-0 cursor-pointer"
            disabled={!activeChannelId || isSending || !draft.trim()}
          >
            <SendHorizontal className="h-4 w-4 !text-primary-foreground" />
            <span className="hidden sm:inline !text-primary-foreground">{t("messages.sendBtn")}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
