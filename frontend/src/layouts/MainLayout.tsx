import React, { useMemo } from "react";
import Header from "../components/header/Header";
import Footer from "@/components/footer/Footer";
import { useProfile } from "@/hooks/useProfile";
import { Outlet, useLocation } from "react-router-dom";
import { useChannelStore } from "@/store/useChannelStore";
import { useUserStore } from "@/store/useUserStore";
import ChatBubbleAvatar from "@/components/avatar/ChatBubbleAvatar";
import ChatBoxList from "@/components/list/ChatBoxList";

const MainLayout: React.FC = () => {
  const { data } = useProfile();
  const location = useLocation();
  const { channels } = useChannelStore();
  const { userInfo } = useUserStore();
  const doctorChannels = useMemo(
    () =>
      channels.map((ch) => ({
        channel: ch,
        picture: ch.participants.find((p) => p.id !== userInfo?.id)!.picture,
      })),
    [channels, userInfo?.id]
  );
  const shouldHideFloatingChat = location.pathname.startsWith("/patient");

  return (
    <div className="relative min-h-screen">
      <Header userInfo={data?.data} />
      <main className="p-6">{<Outlet />}</main>
      <Footer />
      {!shouldHideFloatingChat && (
        <div className="fixed bottom-3 md:bottom-5 lg:bottom-10 right-4 md:flex flex-col items-center gap-3 z-50">
          {doctorChannels?.length > 0 && (
            <div className="flex flex-col gap-3 ml-14">
              {doctorChannels.map((d) => (
                <ChatBubbleAvatar
                  key={d.channel.channel_id}
                  channel={d.channel}
                  picture={d.picture}
                />
              ))}
            </div>
          )}
          <ChatBoxList />
        </div>
      )}
    </div>
  );
};

export default MainLayout;
