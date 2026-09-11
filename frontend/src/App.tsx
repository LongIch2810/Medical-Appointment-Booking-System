import React, { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import SocketProvider from "@/components/providers/SocketProvider";
import NotificationRealtimeProvider from "@/components/providers/NotificationRealtimeProvider";
import { useUserStore } from "@/store/useUserStore";
import { useProfile } from "@/hooks/useProfile";

const App: React.FC = () => {
  const { userInfo, setUserInfo } = useUserStore();
  const { data } = useProfile(true);
  const currentUser = data?.data ?? userInfo;

  useEffect(() => {
    if (data?.data) {
      setUserInfo(data.data);
    }
  }, [data?.data, setUserInfo]);

  return (
    <SocketProvider userId={currentUser?.id}>
      <NotificationRealtimeProvider enabled={Boolean(currentUser?.id)}>
        <AppRoutes />
      </NotificationRealtimeProvider>
    </SocketProvider>
  );
};

export default App;
