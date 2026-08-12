import axiosInstance, { backendOrigin } from "@/configs/axios";
import { io, Socket } from "socket.io-client";

interface PendingEvent {
  id: number;
  event: string;
  data: any;
  isSuccess: boolean;
}

let socket: Socket | null = null;
const pendingEvents: PendingEvent[] = [];
const eventHandlers: { event: string; handler: (...args: any[]) => void }[] =
  [];

export const connectSocket = (userId: number) => {
  socket = io(backendOrigin, {
    transports: ["websocket"],
    withCredentials: true,
  });

  socket.on("notify:event", (data) => {
    console.log(">>> check");
    const index = pendingEvents.findIndex((e) => e.id === data.id);
    if (index !== -1) {
      if (data.isSuccess) {
        pendingEvents.splice(index, 1);
      } else {
        pendingEvents[index].isSuccess = false;
      }
    }
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket?.id);

    eventHandlers.forEach((e) => socket?.on(e.event, e.handler));
    if (pendingEvents.length > 0) {
      pendingEvents.forEach((e) => {
        if (!e.isSuccess) {
          socket?.emit(e.event, e);
        }
      });
    }
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  socket.on("ws-error", async (err) => {
    if (err.code === 401) {
      try {
        console.log("⏳ Token expired, refreshing...");
        await axiosInstance.post("/auth/refresh", {});

        socket?.removeAllListeners();
        socket?.disconnect();
        socket = connectSocket(userId);

        console.log("✅ Token refreshed, reconnecting socket...");
      } catch (error) {
        const index = pendingEvents.findIndex((e) => e.id === err.eventId);
        pendingEvents.splice(index, 1);
        socket?.disconnect();
      }
    }
  });

  return socket;
};

export const safeEmit = (event: string, data: any) => {
  const id = Date.now();
  const newEvent: PendingEvent = { id, event, data, isSuccess: false };
  pendingEvents.push(newEvent);
  // Nếu socket đã kết nối → emit luôn và xóa khỏi queue
  if (socket?.connected) {
    socket.emit(event, newEvent);
  }
};

export const registerHandler = (
  event: string,
  handler: (...args: any[]) => void
) => {
  const exists = eventHandlers.some(
    (e) => e.event === event && e.handler === handler
  );
  if (!exists) {
    eventHandlers.push({ event, handler });
    if (socket?.connected) {
      socket.on(event, handler);
    }
  }
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    eventHandlers.length = 0;
    console.log("🔌 Socket disconnected");
  }
};
