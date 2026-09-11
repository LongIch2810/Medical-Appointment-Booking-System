import { notificationQueryKeys } from "@/hooks/useNotifications";
import { useSocket } from "@/hooks/useSocket";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  MyNotificationListPayload,
  Notification,
  NotificationListResponse,
} from "@/types/interface/notification.interface";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, type PropsWithChildren } from "react";
import { toast } from "react-toastify";
import { useUserSettings } from "@/hooks/useSettings";

type NotificationRealtimeProviderProps = PropsWithChildren<{
  enabled: boolean;
}>;

export function NotificationRealtimeProvider({
  children,
  enabled,
}: NotificationRealtimeProviderProps) {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const toastedIds = useRef(new Set<number>());
  const settingsQuery = useUserSettings(enabled);
  const realtimeToastsEnabled =
    settingsQuery.data?.data.realtimeToastsEnabled ?? true;

  useEffect(() => {
    if (!enabled || !socket) return;
    const sync = () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    };
    const updateMine = (
      updater: (
        data: NotificationListResponse,
        filters: MyNotificationListPayload,
      ) => NotificationListResponse,
    ) => {
      queryClient
        .getQueryCache()
        .findAll({ queryKey: [...notificationQueryKeys.all, "mine"] })
        .forEach((query) => {
          const filters = (query.queryKey[2] ?? {}) as MyNotificationListPayload;
          queryClient.setQueryData<ApiResponse<NotificationListResponse>>(
            query.queryKey,
            (current) =>
              current
                ? { ...current, data: updater(current.data, filters) }
                : current,
          );
        });
    };
    const handleNew = (notification: Notification) => {
      updateMine((data, filters) => {
        const matchesFilter =
          (filters.isRead === undefined || filters.isRead === notification.isRead) &&
          (filters.type === undefined || filters.type === notification.type);
        if (
          !matchesFilter ||
          data.notifications.some(({ id }) => id === notification.id)
        ) {
          return data;
        }
        const limit = filters.limit ?? data.limit ?? 20;
        const total = data.total + 1;
        return {
          ...data,
          notifications: [notification, ...data.notifications].slice(0, limit),
          total,
          totalPages: Math.ceil(total / limit),
        };
      });
      if (!notification.isRead) {
        queryClient.setQueryData<ApiResponse<{ count: number }>>(
          notificationQueryKeys.unread(),
          (current) =>
            current
              ? { ...current, data: { count: current.data.count + 1 } }
              : current,
        );
      }
      if (toastedIds.current.has(notification.id)) return;
      toastedIds.current.add(notification.id);
      if (toastedIds.current.size > 200) {
        const oldestId = toastedIds.current.values().next().value;
        if (oldestId !== undefined) toastedIds.current.delete(oldestId);
      }
      if (realtimeToastsEnabled) {
        toast.info(`${notification.title}: ${notification.content}`);
      }
    };
    const handleUpdated = (notification: Notification) => {
      updateMine((data, filters) => {
        const existed = data.notifications.some(({ id }) => id === notification.id);
        const matchesFilter =
          (filters.isRead === undefined || filters.isRead === notification.isRead) &&
          (filters.type === undefined || filters.type === notification.type);
        if (!existed) return data;
        if (!matchesFilter) {
          const total = Math.max(0, data.total - 1);
          return {
            ...data,
            notifications: data.notifications.filter(({ id }) => id !== notification.id),
            total,
            totalPages: Math.ceil(total / (filters.limit ?? data.limit ?? 20)),
          };
        }
        return {
          ...data,
          notifications: data.notifications.map((item) =>
            item.id === notification.id ? notification : item,
          ),
        };
      });
      sync();
    };
    const handleDeleted = ({ id }: { id: number }) => {
      updateMine((data, filters) => {
        if (!data.notifications.some((item) => item.id === id)) return data;
        const total = Math.max(0, data.total - 1);
        return {
          ...data,
          notifications: data.notifications.filter((item) => item.id !== id),
          total,
          totalPages: Math.ceil(total / (filters.limit ?? data.limit ?? 20)),
        };
      });
      sync();
    };
    const handleReadAll = () => {
      queryClient.setQueryData<ApiResponse<{ count: number }>>(
        notificationQueryKeys.unread(),
        (current) =>
          current ? { ...current, data: { count: 0 } } : current,
      );
      updateMine((data, filters) => {
        if (filters.isRead === false) {
          return { ...data, notifications: [], total: 0, totalPages: 0 };
        }
        return {
          ...data,
          notifications: data.notifications.map((item) => ({
            ...item,
            isRead: true,
          })),
        };
      });
    };

    socket.on("connect", sync);
    socket.on("notification:new", handleNew);
    socket.on("notification:updated", handleUpdated);
    socket.on("notification:deleted", handleDeleted);
    socket.on("notification:read-all", handleReadAll);
    return () => {
      socket.off("connect", sync);
      socket.off("notification:new", handleNew);
      socket.off("notification:updated", handleUpdated);
      socket.off("notification:deleted", handleDeleted);
      socket.off("notification:read-all", handleReadAll);
    };
  }, [enabled, queryClient, realtimeToastsEnabled, socket]);

  return children;
}
