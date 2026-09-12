import NotificationToast, {
  NotificationToastCloseButton,
} from "@/components/notification/NotificationToast";
import { useSocket } from "@/hooks/useSocket";
import { notificationQueryKeys, useOpenNotification } from "@/hooks/useNotifications";
import type {
  AppNotification,
  NotificationListData,
  NotificationListParams,
} from "@/types/interface/notification.interface";
import type { ApiResponse } from "@/types/interface/patient.interface";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useUserSettings } from "@/hooks/useSettings";

type NotificationRealtimeProviderProps = PropsWithChildren<{
  enabled: boolean;
}>;

export default function NotificationRealtimeProvider({
  children,
  enabled,
}: NotificationRealtimeProviderProps) {
  const { t } = useTranslation();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const toastedIds = useRef(new Set<number>());
  const settingsQuery = useUserSettings(enabled);
  const realtimeToastsEnabled =
    settingsQuery.data?.data.realtimeToastsEnabled ?? true;
  const openNotification = useOpenNotification();

  useEffect(() => {
    if (!enabled || !socket) return;

    const syncNotifications = () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    };
    const updateLists = (
      updater: (
        data: NotificationListData,
        params: NotificationListParams,
      ) => NotificationListData,
    ) => {
      queryClient
        .getQueryCache()
        .findAll({ queryKey: [...notificationQueryKeys.all, "list"] })
        .forEach((query) => {
          const params = (query.queryKey[2] ?? {}) as NotificationListParams;
          queryClient.setQueryData<ApiResponse<NotificationListData>>(
            query.queryKey,
            (current) =>
              current
                ? { ...current, data: updater(current.data, params) }
                : current,
          );
        });
    };
    const handleNew = (notification: AppNotification) => {
      updateLists((data, params) => {
        const matchesFilter =
          (params.isRead === undefined || params.isRead === notification.isRead) &&
          (params.type === undefined || params.type === notification.type);
        if (
          !matchesFilter ||
          data.notifications.some(({ id }) => id === notification.id)
        ) {
          return data;
        }
        const limit = params.limit ?? data.limit ?? 20;
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
        toast(
          <NotificationToast
            notification={notification}
            onOpen={openNotification}
            openLabel={t("notifications.openNotification")}
          />,
          {
            icon: false,
            closeButton: NotificationToastCloseButton,
            closeOnClick: true,
            autoClose: 6000,
            hideProgressBar: true,
            className: "notification-realtime-toast",
          },
        );
      }
    };
    const handleUpdated = (notification: AppNotification) => {
      updateLists((data, params) => {
        const existed = data.notifications.some(({ id }) => id === notification.id);
        const matchesFilter =
          (params.isRead === undefined || params.isRead === notification.isRead) &&
          (params.type === undefined || params.type === notification.type);
        if (!existed) return data;
        if (!matchesFilter) {
          const total = Math.max(0, data.total - 1);
          return {
            ...data,
            notifications: data.notifications.filter(({ id }) => id !== notification.id),
            total,
            totalPages: Math.ceil(total / (params.limit ?? data.limit ?? 20)),
          };
        }
        return {
          ...data,
          notifications: data.notifications.map((item) =>
            item.id === notification.id ? notification : item,
          ),
        };
      });
      syncNotifications();
    };
    const handleDeleted = ({ id }: { id: number }) => {
      updateLists((data, params) => {
        if (!data.notifications.some((item) => item.id === id)) return data;
        const total = Math.max(0, data.total - 1);
        return {
          ...data,
          notifications: data.notifications.filter((item) => item.id !== id),
          total,
          totalPages: Math.ceil(total / (params.limit ?? data.limit ?? 20)),
        };
      });
      syncNotifications();
    };
    const handleReadAll = () => {
      queryClient.setQueryData<ApiResponse<{ count: number }>>(
        notificationQueryKeys.unread(),
        (current) =>
          current ? { ...current, data: { count: 0 } } : current,
      );
      updateLists((data, params) => {
        if (params.isRead === false) {
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

    socket.on("connect", syncNotifications);
    socket.on("notification:new", handleNew);
    socket.on("notification:updated", handleUpdated);
    socket.on("notification:deleted", handleDeleted);
    socket.on("notification:read-all", handleReadAll);

    return () => {
      socket.off("connect", syncNotifications);
      socket.off("notification:new", handleNew);
      socket.off("notification:updated", handleUpdated);
      socket.off("notification:deleted", handleDeleted);
      socket.off("notification:read-all", handleReadAll);
    };
  }, [enabled, openNotification, queryClient, realtimeToastsEnabled, socket, t]);

  return children;
}
