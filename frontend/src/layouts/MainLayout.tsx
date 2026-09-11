import React, { useEffect, useMemo, Suspense } from "react";
import Header from "../components/header/Header";
import Footer from "@/components/footer/Footer";
import { useProfile } from "@/hooks/useProfile";
import { Outlet, useLocation } from "react-router-dom";
import { useChannelStore } from "@/store/useChannelStore";
import { useUserStore } from "@/store/useUserStore";
import ChatBubbleAvatar from "@/components/avatar/ChatBubbleAvatar";
import ChatBoxList from "@/components/list/ChatBoxList";
import { cn } from "@/lib/utils";
import EducationalDisclaimerModal from "@/components/dialog/EducationalDisclaimerModal";
import RouteLoadingFallback from "@/components/common/RouteLoadingFallback";

const MainLayout: React.FC = () => {
  const location = useLocation();
  const { channels } = useChannelStore();
  const { userInfo, setUserInfo } = useUserStore();
  const { data } = useProfile(true);
  const currentUser = data?.data ?? userInfo;

  useEffect(() => {
    if (data?.data) {
      setUserInfo(data.data);
    }
  }, [data?.data, setUserInfo]);

  const doctorChannels = useMemo(
    () =>
      channels.map((ch) => ({
        channel: ch,
        picture: ch.participants.find((p) => p.id !== currentUser?.id)?.picture,
      })),
    [channels, currentUser?.id]
  );
  const isChatbot = location.pathname.startsWith("/chatbot");
  const isPatient = location.pathname.startsWith("/patient");
  const shouldHideFloatingChat = isPatient || isChatbot;
  // Trang Chatbot chiếm trọn khung nhìn màn hình — Footer được ẩn để không gây cuộn thừa
  const shouldHideFooter = isChatbot;

  return (
    <div
      className={cn(
        "relative w-full flex flex-col justify-between overflow-x-hidden",
        isChatbot ? "h-screen max-h-screen overflow-hidden" : "min-h-screen",
      )}
    >
      <Header userInfo={currentUser} />
      <main
        className={cn(
          "w-full",
          isChatbot
            ? "flex-1 h-[calc(100vh-72px)] lg:h-[calc(100vh-112px)] mt-[72px] lg:mt-[112px] p-2 sm:p-4 overflow-hidden flex flex-col items-center justify-center bg-slate-100/70"
            : "flex-1 p-4 sm:p-6",
        )}
      >
        <Suspense fallback={<RouteLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      {!shouldHideFooter && <Footer />}
      <EducationalDisclaimerModal autoOpenOnHome={location.pathname === "/"} />
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
