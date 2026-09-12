import type { RefObject } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import AssistantMessage from "./AssistantMessage";
import UserMessage from "./UserMessage";
import type { ChatMessage } from "./types";

interface MessageListProps {
  messages: ChatMessage[];
  scrollAreaWrapperRef: RefObject<HTMLDivElement | null>;
  onRetry: (id: number, question: string) => void;
}

export default function MessageList({
  messages,
  scrollAreaWrapperRef,
  onRetry,
}: MessageListProps) {
  return (
    <div ref={scrollAreaWrapperRef} className="h-full w-full overflow-hidden">
      <ScrollArea className="h-full w-full">
        <div className="mx-auto max-w-[900px] px-3 sm:px-4 py-4 space-y-5">
          {messages.map(({ id, content, role, isTyping, elapsed, isError, retryQuestion }) =>
            role === "human" ? (
              <UserMessage key={id} content={content} />
            ) : (
              <AssistantMessage
                key={id}
                content={content}
                isTyping={isTyping}
                elapsed={elapsed}
                isError={isError}
                onRetry={
                  isError && retryQuestion !== undefined
                    ? () => onRetry(id, retryQuestion)
                    : undefined
                }
              />
            )
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
