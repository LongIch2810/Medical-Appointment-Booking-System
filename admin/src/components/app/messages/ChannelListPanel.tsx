import type { FC } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Channel } from "@/types/interface/channel.interface";

interface ChannelListPanelProps {
  channels: Channel[];
  activeChannelId: number | null;
  className?: string;
}

const ChannelListPanel: FC<
  ChannelListPanelProps & { onSelect: (channelId: number) => void }
> = ({ channels, activeChannelId, onSelect, className }) => {
  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden",
        className,
      )}
    >
      <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4 bg-slate-50/50 dark:bg-slate-950/40">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
          <span>Danh sách hội thoại</span>
          <Badge variant="outline" className="text-[10px] font-bold">
            {channels.length}
          </Badge>
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-soft divide-y divide-slate-100 dark:divide-slate-800/60">
        {channels.map((channel) => {
          const otherParticipants = channel.participants.filter(
            (p) => p.id !== 0,
          );
          const displayName =
            otherParticipants.map((p) => p.fullname).join(", ") ||
            `Hội thoại #${channel.channel_id}`;
          const lastMsg = channel.last_message;
          const isSelected = activeChannelId === channel.channel_id;

          return (
            <button
              key={channel.channel_id}
              type="button"
              aria-current={isSelected ? "true" : undefined}
              onClick={() => onSelect(channel.channel_id)}
              className={cn(
                "w-full px-4 py-3.5 text-left transition-all cursor-pointer",
                isSelected
                  ? "bg-teal-50/80 dark:bg-teal-950/40 border-l-4 border-primary"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "truncate text-xs sm:text-sm font-bold",
                    isSelected
                      ? "text-primary dark:text-emerald-400"
                      : "text-slate-900 dark:text-slate-100",
                  )}
                >
                  {displayName}
                </span>
                {channel.unread_count > 0 ? (
                  <Badge
                    variant="danger"
                    className="shrink-0 text-[10px] px-1.5 py-0 font-bold"
                    aria-label={`${channel.unread_count} tin nhắn chưa đọc`}
                  >
                    {channel.unread_count}
                  </Badge>
                ) : null}
              </div>
              {lastMsg ? (
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400 break-words">
                  {lastMsg.content}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChannelListPanel;
