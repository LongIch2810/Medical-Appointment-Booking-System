import type { FC } from "react";
import { Plus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Loading from "@/components/loading/Loading";
import ErrorState from "@/components/notification/ErrorState";
import NotFoundResult from "@/components/notification/NotFoundResult";
import { cn } from "@/lib/utils";
import type { Channel } from "@/types/interface/patient.interface";
import {
  getChatPersonAvatar,
  getChatPersonInitial,
  getChatPersonName,
  getLastMessage,
  getLastMessageTime,
} from "./messageHelpers";

import { useTranslation } from "react-i18next";

interface ChannelListProps {
  channels: Channel[];
  activeChannelId: number;
  currentUserId?: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectChannel: (channelId: number) => void;
  onCreateNew: () => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const ChannelList: FC<ChannelListProps> = ({
  channels,
  activeChannelId,
  currentUserId,
  isLoading,
  isError,
  onRetry,
  onSelectChannel,
  onCreateNew,
  page,
  totalPages,
  onPageChange,
  className,
}) => {
  const { t } = useTranslation();

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 p-4.5 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {t("messages.pageTitle")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("messages.pageSubtitle")}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8.5 w-8.5 rounded-xl !bg-primary hover:!bg-primary/90 !text-white p-0 shadow-xs cursor-pointer"
          onClick={onCreateNew}
          aria-label={t("messages.searchDoctorBtn")}
          title={t("messages.searchDoctorBtn")}
        >
          <Plus className="h-4 w-4 !text-white" />
        </Button>
      </div>
      <div className="flex-1 space-y-2 p-3 overflow-y-auto dark:bg-slate-900/40">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loading size={28} />
          </div>
        ) : isError ? (
          <ErrorState
            title={t("common.error")}
            description="Error loading conversations."
            onRetry={onRetry}
          />
        ) : channels.length === 0 ? (
          <NotFoundResult
            title={t("messages.emptyChannels")}
            description={t("messages.emptyChannelsDesc")}
          />
        ) : (
          channels.map((channel) => (
            <button
              key={channel.id}
              type="button"
              aria-current={channel.id === activeChannelId ? "true" : undefined}
              className={cn(
                "w-full rounded-2xl border p-3.5 text-left transition-all cursor-pointer",
                channel.id === activeChannelId
                  ? "border-primary bg-primary/10 dark:bg-primary/20 dark:border-primary/80 shadow-2xs"
                  : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/60 hover:border-primary/40 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/60",
              )}
              onClick={() => onSelectChannel(channel.id)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
                  <AvatarImage
                    src={getChatPersonAvatar(channel, currentUserId) ?? ""}
                    alt={getChatPersonName(channel, currentUserId)}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-xs font-bold text-primary dark:text-sky-300">
                    {getChatPersonInitial(channel, currentUserId)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      {getChatPersonName(channel, currentUserId)}
                    </p>
                    {channel.unread_count > 0 && (
                      <Badge
                        className="bg-primary text-white text-[10px] px-1.5 py-0.2"
                        aria-label={`${channel.unread_count} unread`}
                      >
                        {channel.unread_count}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] font-semibold text-primary dark:text-sky-400">
                    {t("home.statDoctors")}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-600 dark:text-slate-300 break-words">
                    {getLastMessage(channel)}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    {getLastMessageTime(channel)}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className="rounded-xl text-xs cursor-pointer"
            >
              {t("common.back")}
            </Button>
            <span className="text-[11px] font-semibold text-slate-500">
              {page}/{totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              className="rounded-xl text-xs cursor-pointer"
            >
              {t("common.more")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelList;
