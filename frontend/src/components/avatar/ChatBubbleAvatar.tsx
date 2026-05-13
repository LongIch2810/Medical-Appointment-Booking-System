import { User, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useChannelStore, type Channel } from "@/store/useChannelStore";

interface ChatBubbleAvatarProps {
  channel: Channel;
  picture?: string | null;
}
const ChatBubbleAvatar = ({ channel, picture }: ChatBubbleAvatarProps) => {
  const { setChatBoxChannels, setChannels } = useChannelStore();
  const handleClickOpenChatBox = () => {
    setChatBoxChannels((prev) => [...prev, channel]);
    setChannels((prev) =>
      prev.filter((p) => p.channel_id !== channel.channel_id)
    );
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setChannels((prev) =>
      prev.filter((p) => p.channel_id !== channel.channel_id)
    );
  };
  return (
    <div className="relative" onClick={handleClickOpenChatBox}>
      <Avatar className="w-12 h-12 border-2 border-white shadow-lg bg-gray-100 cursor-pointer">
        <AvatarImage src={picture || ""} alt="user" />
        <AvatarFallback>
          <User size={18} className="text-primary" />
        </AvatarFallback>
      </Avatar>
      <div
        onClick={handleRemove}
        className="absolute p-0.5 bg-error rounded-full text-white -top-1 -right-1 hover:bg-white border hover:text-error border-error transition-all"
      >
        <X size={10} />
      </div>
    </div>
  );
};

export default ChatBubbleAvatar;
