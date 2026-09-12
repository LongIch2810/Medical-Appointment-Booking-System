import type { FC } from "react";

import { cn } from "@/lib/utils";
import type { Message } from "@/types/interface/patient.interface";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  onRetry?: (message: Message) => void;
}

const MessageBubble: FC<MessageBubbleProps> = ({ message, isMine, onRetry }) => {
  return (
    <div
      className={cn(
        "max-w-[82%] sm:max-w-[75%] rounded-2xl px-4.5 py-3 text-xs sm:text-sm shadow-2xs",
        isMine
          ? "ml-auto rounded-br-xs bg-primary text-primary-foreground dark:bg-teal-500/25 dark:text-teal-100 dark:border dark:border-teal-500/35 font-medium"
          : "rounded-bl-xs bg-white dark:bg-[#172033] text-slate-800 dark:text-[#F1F5F9] border border-slate-200/70 dark:border-[#293548]",
        message.isOptimistic && "opacity-70",
        message.failed && "border border-rose-300 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300",
      )}
    >
      {!isMine && (
        <p className="mb-1 text-xs font-bold text-primary dark:text-teal-400">
          BS. {message.sender.fullname ?? message.sender.username ?? "Bác sĩ"}
        </p>
      )}
      <p className="leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
        {message.content}
      </p>
      <div
        className={cn(
          "mt-1.5 flex items-center justify-end gap-2 text-[10px] font-medium",
          isMine && !message.failed ? "text-primary-foreground/75 dark:text-teal-200/75" : "text-slate-400 dark:text-[#94A3B8]",
        )}
      >
        {message.failed ? (
          <button
            type="button"
            onClick={() => onRetry?.(message)}
            className="font-bold text-rose-600 dark:text-rose-400 underline decoration-dotted underline-offset-2"
          >
            Gửi thất bại, nhấn để thử lại
          </button>
        ) : message.isOptimistic ? (
          <span>Đang gửi...</span>
        ) : (
          <span>{message.created_at}</span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
