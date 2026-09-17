import axiosInstance, { backendOrigin } from "@/configs/axios";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";

interface PendingEvent {
  id: number;
  event: string;
  data: unknown;
  isSuccess: boolean;
}

interface WsErrorPayload {
  code?: number;
  message?: string;
  eventId?: number;
  retryAfter?: number;
}

let socket: Socket | null = null;
const pendingEvents: PendingEvent[] = [];
let nextEventId = Date.now();

export const connectSocket = () => {
  if (socket) {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  const newSocket = io(backendOrigin, {
    transports: ["websocket"],
    withCredentials: true,
    auth: {
      appContext: "patient",
    },
  });
  socket = newSocket;

  newSocket.on("notify:event", (data) => {
    const index = pendingEvents.findIndex((e) => e.id === data.id);
    if (index !== -1) {
      if (data.isSuccess) {
        pendingEvents.splice(index, 1);
      } else {
        pendingEvents[index].isSuccess = false;
      }
    }
  });

  newSocket.on("connect", () => {
    console.log("Socket connected:", newSocket.id);

    const eventsToReplay = new Set(
      pendingEvents
        .filter((event) => !event.isSuccess)
        .map((event) => event.id),
    );

    setTimeout(() => {
      if (socket !== newSocket || !newSocket.connected) return;

      pendingEvents.forEach((event) => {
        if (eventsToReplay.has(event.id) && !event.isSuccess) {
          newSocket.emit(event.event, event);
        }
      });
    }, 0);
  });

  newSocket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  let isRefreshingToken = false;
  newSocket.on("ws-error", async (err: WsErrorPayload) => {
    if (err.code === 429) {
      if (typeof err.eventId === "number") {
        const index = pendingEvents.findIndex((e) => e.id === err.eventId);
        if (index !== -1) {
          pendingEvents.splice(index, 1);
        }
      }

      const retryAfter = Math.max(0, Number(err.retryAfter) || 0);
      toast.error(
        retryAfter > 0
          ? `Bạn đang thao tác quá nhanh. Vui lòng thử lại sau ${retryAfter} giây.`
          : "Bạn đang thao tác quá nhanh. Vui lòng thử lại sau.",
        { toastId: "websocket-rate-limit" },
      );
      return;
    }

    if (err.code === 401) {
      if (isRefreshingToken) return;
      isRefreshingToken = true;
      try {
        await axiosInstance.post("/auth/refresh", {});

        if (socket === newSocket) {
          newSocket.disconnect();
          newSocket.connect();
        }
      } catch {
        const index = pendingEvents.findIndex((e) => e.id === err.eventId);
        if (index !== -1) {
          pendingEvents.splice(index, 1);
        }
        if (socket === newSocket) {
          newSocket.disconnect();
        }
      } finally {
        isRefreshingToken = false;
      }
    }
  });

  return newSocket;
};

export const safeEmit = (event: string, data: unknown) => {
  const id = ++nextEventId;
  const newEvent: PendingEvent = { id, event, data, isSuccess: false };
  pendingEvents.push(newEvent);
  // Nếu socket đã kết nối → emit luôn và xóa khỏi queue
  if (socket?.connected) {
    socket.emit(event, newEvent);
  }

  return id;
};

export const cancelPendingEvent = (id: number) => {
  const index = pendingEvents.findIndex((event) => event.id === id);
  if (index !== -1) {
    pendingEvents.splice(index, 1);
  }
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    pendingEvents.length = 0;
    console.log("Socket disconnected");
  }
};
