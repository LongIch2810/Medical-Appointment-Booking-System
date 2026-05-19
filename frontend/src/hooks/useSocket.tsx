import { connectSocket, disconnectSocket } from "@/utils/socket";
import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

export function useSocket(userId?: number) {
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    if (!userId) return;

    const newSocket = connectSocket(userId);
    setSocket(newSocket);

    return () => {
      disconnectSocket();
      setSocket(null);
    };
  }, [userId]);

  return socket;
}
