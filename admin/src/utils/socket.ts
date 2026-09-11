import { backendOrigin, refreshInstance } from "@/configs/axios";
import { toast } from "react-toastify";
import { io, type Socket } from "socket.io-client";

interface WsErrorPayload {
  code?: number;
  retryAfter?: number;
}

let socket: Socket | null = null;

export function connectSocket() {
  if (socket) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  const newSocket = io(backendOrigin, {
    transports: ["websocket"],
    withCredentials: true,
  });
  socket = newSocket;
  let isRefreshing = false;

  newSocket.on("ws-error", async (error: WsErrorPayload) => {
    if (error.code === 429) {
      const retryAfter = Math.max(0, Number(error.retryAfter) || 0);
      toast.error(
        retryAfter > 0
          ? `Bạn đang thao tác quá nhanh. Vui lòng thử lại sau ${retryAfter} giây.`
          : "Bạn đang thao tác quá nhanh. Vui lòng thử lại sau.",
        { toastId: "websocket-rate-limit" }
      );
      return;
    }

    if (error.code !== 401 || isRefreshing) return;
    isRefreshing = true;
    try {
      await refreshInstance.post("/auth/refresh", {});
      if (socket === newSocket) {
        newSocket.disconnect();
        newSocket.connect();
      }
    } catch {
      if (socket === newSocket) newSocket.disconnect();
    } finally {
      isRefreshing = false;
    }
  });

  return newSocket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
