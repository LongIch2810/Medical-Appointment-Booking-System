import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/store/useUserStore";
import { useGetMessagesChatbotInfinite } from "@/hooks/useGetMessagesChatbotInfinite";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { sendChatbotMessage } from "@/api/conversationApi";
import ErrorState from "@/components/notification/ErrorState";
import Loading from "@/components/loading/Loading";
import ChatHeader from "@/components/chatbot/ChatHeader";
import MedicalDisclaimer from "@/components/chatbot/MedicalDisclaimer";
import WelcomeState from "@/components/chatbot/WelcomeState";
import MessageList from "@/components/chatbot/MessageList";
import ChatComposer from "@/components/chatbot/ChatComposer";
import type { ChatMessage } from "@/components/chatbot/types";

export default function Chatbot() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  // ScrollArea (Radix) không forward ref tới phần tử thật sự cuộn được
  // (viewport nằm bên trong Root) — bọc ScrollArea trong 1 div, sau đó dò
  // tìm viewport qua data-slot="scroll-area-viewport" mà shadcn gán sẵn.
  const scrollAreaWrapperRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const { userInfo } = useUserStore();
  const userId = userInfo?.id ?? 0;
  const { data, hasNextPage, fetchNextPage, isFetching, isLoading, isError, refetch } =
    useGetMessagesChatbotInfinite(userId);
  const queryClient = useQueryClient();
  const messages: ChatMessage[] = useMemo(() => {
    const merged =
      data?.pages
        .slice()
        .reverse()
        .flatMap((page) => page.data.messages) ?? [];
    const serverMessages = Array.from(
      new Map(merged.map((m) => [m.id, m])).values()
    );
    // Việc dọn optimisticMessages được xử lý tường minh theo id trong
    // runSend (sau khi invalidateQueries đưa dòng thật vào serverMessages)
    // — không còn so khớp theo (role, content) ở đây nữa, vì cách đó ẩn nhầm
    // tin nhắn vừa gửi khi trùng nội dung với 1 tin nhắn cũ trong lịch sử
    // (vd gửi lại "hello" nhiều lần).
    return [...serverMessages, ...optimisticMessages];
  }, [data, optimisticMessages]);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (!userInfo) {
      navigate("/sign-in");
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    // MessageList (và ScrollArea bên trong) chỉ mount khi hasMessages=true
    // (welcome state thay chỗ khi rỗng) — dò lại viewport mỗi khi trạng thái
    // này đổi từ false sang true.
    const viewport = scrollAreaWrapperRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]'
    );
    viewportRef.current = viewport ?? null;
  }, [hasMessages]);

  useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleScroll = useCallback(async () => {
    const container = viewportRef.current;
    if (!container) return;
    if (container.scrollTop === 0 && hasNextPage && !isFetching) {
      const prevScrollHeight = container.scrollHeight;
      await fetchNextPage();
      requestAnimationFrame(() => {
        if (viewportRef.current) {
          const newScrollHeight = viewportRef.current.scrollHeight;
          viewportRef.current.scrollTop = newScrollHeight - prevScrollHeight;
        }
      });
    }
  }, [hasNextPage, isFetching, fetchNextPage]);

  useEffect(() => {
    const container = viewportRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll, hasMessages]);

  const clearTypingInterval = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  // Logic dùng chung cho gửi tin nhắn mới và bấm "Thử lại" trên 1 tin nhắn
  // lỗi — humanId/aiId là cặp id được tạo liền kề (aiId = humanId + 1) từ
  // lúc optimistic message được thêm vào, giữ nguyên để filter đúng cặp khi
  // gửi thành công.
  const runSend = async (question: string, humanId: number, aiId: number) => {
    setIsPending(true);
    const startTime = Date.now();

    setOptimisticMessages((prev) =>
      prev.map((msg) =>
        msg.id === aiId
          ? {
              ...msg,
              content: "",
              isTyping: true,
              isError: false,
              startTypingAt: startTime,
              elapsed: 0,
            }
          : msg
      )
    );

    typingIntervalRef.current = setInterval(() => {
      setOptimisticMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiId
            ? {
                ...msg,
                elapsed: (Date.now() - (msg.startTypingAt ?? Date.now())) / 1000,
              }
            : msg
        )
      );
    }, 100);

    try {
      const answer = await sendChatbotMessage(question);
      clearTypingInterval();
      setOptimisticMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiId
            ? { ...msg, isTyping: false, isError: false, content: answer }
            : msg
        )
      );
      // invalidateQueries đợi refetch xong (mặc định refetchType: "active")
      // rồi mới resolve, nên serverMessages đã có 2 dòng thật trước khi ta
      // dọn optimisticMessages — tránh nhấp nháy mất tin nhắn giữa 2 bước.
      await queryClient.invalidateQueries({
        queryKey: ["messages-chatbot", userId],
      });
      setOptimisticMessages((prev) =>
        prev.filter((msg) => msg.id !== humanId && msg.id !== aiId)
      );
    } catch (error) {
      clearTypingInterval();
      setOptimisticMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiId
            ? {
                ...msg,
                isTyping: false,
                isError: true,
                content: t("chatbot.requestFailed"),
                retryQuestion: question,
              }
            : msg
        )
      );
      console.error("Chatbot request failed:", error);
    } finally {
      setIsPending(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isPending || !userId) return;

    const question = input;
    setInput("");

    const humanId = Date.now();
    const aiId = humanId + 1;

    setOptimisticMessages((prev) => [
      ...prev,
      { id: humanId, content: question, role: "human" },
      {
        id: aiId,
        content: "",
        role: "ai",
        isTyping: true,
        startTypingAt: Date.now(),
        elapsed: 0,
      },
    ]);

    runSend(question, humanId, aiId);
  };

  const handleRetry = (aiId: number, question: string) => {
    if (isPending) return;
    runSend(question, aiId - 1, aiId);
  };

  return (
    <section className="w-full h-full flex flex-col items-center overflow-hidden">
      <div className="w-full h-full max-w-4xl lg:max-w-5xl 2xl:max-w-6xl flex flex-col gap-2 sm:gap-3 min-h-0">
        <div className="shrink-0 mx-auto w-full max-w-[900px] px-3 sm:px-4 flex flex-col gap-2">
          <ChatHeader />
          <MedicalDisclaimer />
        </div>

        {isLoading ? (
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <Loading size={28} />
          </div>
        ) : isError ? (
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <ErrorState
              description={t("chatbot.historyLoadFailed")}
              onRetry={() => refetch()}
            />
          </div>
        ) : !hasMessages ? (
          <div className="flex-1 min-h-0">
            <WelcomeState onQuickAction={setInput} />
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <MessageList
              messages={messages}
              scrollAreaWrapperRef={scrollAreaWrapperRef}
              onRetry={handleRetry}
            />
          </div>
        )}

        <ChatComposer
          value={input}
          onChange={setInput}
          onSend={handleSend}
          isPending={isPending}
        />
      </div>
    </section>
  );
}
