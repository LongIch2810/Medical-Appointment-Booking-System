import { SocketContext } from "@/hooks/useSocket";
import { connectSocket, disconnectSocket } from "@/utils/socket";
import { useEffect, useState, type PropsWithChildren } from "react";
import type { Socket } from "socket.io-client";

type SocketProviderProps = PropsWithChildren<{ userId?: number }>;

export function SocketProvider({ children, userId }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!userId) {
      disconnectSocket();
      setSocket(null);
      return;
    }
    const nextSocket = connectSocket();
    setSocket(nextSocket);
    return disconnectSocket;
  }, [userId]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
