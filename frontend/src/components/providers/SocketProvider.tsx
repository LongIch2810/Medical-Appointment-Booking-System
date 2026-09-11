import { SocketContext } from "@/hooks/useSocket";
import { connectSocket, disconnectSocket } from "@/utils/socket";
import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import type { Socket } from "socket.io-client";

type SocketProviderProps = PropsWithChildren<{
  userId?: number;
}>;

export default function SocketProvider({
  children,
  userId,
}: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const prevUserIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!userId) {
      if (prevUserIdRef.current) {
        disconnectSocket();
        setSocket(null);
      }
      prevUserIdRef.current = undefined;
      return;
    }

    if (prevUserIdRef.current && prevUserIdRef.current !== userId) {
      disconnectSocket();
    }
    prevUserIdRef.current = userId;

    const currentSocket = connectSocket();
    setSocket(currentSocket);

    // Lưu ý: Không disconnect khi unmount component (ví dụ khi chuyển route).
    // Kết nối socket được duy trì xuyên suốt session và chỉ ngắt khi đăng xuất (userId bị xóa).
  }, [userId]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
