import { useChannelStore } from "@/store/useChannelStore";
import { ChatBox } from "../chatbox/ChatBox";
import { useUserStore } from "@/store/useUserStore";

const ChatBoxList = () => {
  const { channels, chatBoxChannels } = useChannelStore();
  const { userInfo } = useUserStore();
  return (
    <div
      className={`fixed bottom-3 md:bottom-5 lg:bottom-10 right-4 flex flex-row-reverse gap-4 ${
        channels?.length > 0 ? "mr-14" : ""
      }`}
    >
      {chatBoxChannels?.length > 0 &&
        chatBoxChannels.map((cb) => {
          const participant = cb.participants.find(
            (p) => p.id !== userInfo?.id
          );

          return (
            <ChatBox
              channel={cb}
              key={cb.channel_id}
              title={participant?.username ?? participant?.fullname ?? "Bác sĩ"}
              avatar={participant?.picture ?? undefined}
            />
          );
        })}
    </div>
  );
};

export default ChatBoxList;
