import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserStore } from "@/store/useUserStore";
import MarkdownMessage from "@/components/message/MarkdownMessage";
import MedicalAILoading from "@/components/animation/MedicalAILoading";
import MedicalRobotAvatar from "@/components/animation/MedicalRobotAvatar";
import Loading from "@/components/loading/Loading";
import { useGetMessagesChatbotInfinite } from "@/hooks/useGetMessagesChatbotInfinite";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { sendChatbotMessage } from "@/api/conversationApi";
import { AlertCircle, Send } from "lucide-react";

type Role = "human" | "ai";

interface Message {
  id: number;
  content: string;
  role: Role;
  isTyping?: boolean;
  startTypingAt?: number;
  elapsed?: number;
}

export default function Chatbot() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  // ScrollArea (Radix) không forward ref tới phần tử thật sự cuộn được
  // (viewport nằm bên trong Root) — bọc ScrollArea trong 1 div, sau đó dò
  // tìm viewport qua data-slot="scroll-area-viewport" mà shadcn gán sẵn.
  const scrollAreaWrapperRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const { userInfo } = useUserStore();
  const userId = userInfo?.id ?? 0;
  // Cùng cách lấy chữ cái đầu làm fallback avatar như PatientLayout.tsx
  // (trang Dashboard) — đồng bộ khi user chưa có ảnh đại diện, thay vì rơi
  // về icon người chung chung không liên quan tới tài khoản.
  const userInitial =
    userInfo?.fullname?.charAt(0)?.toUpperCase() ??
    userInfo?.username?.charAt(0)?.toUpperCase() ??
    "B";
  const { data, hasNextPage, fetchNextPage, isFetching } =
    useGetMessagesChatbotInfinite(userId);
  const queryClient = useQueryClient();
  const messages: Message[] = useMemo(() => {
    const merged =
      data?.pages
        .slice()
        .reverse()
        .flatMap((page) => page.data.messages) ?? [];
    const serverMessages = Array.from(
      new Map(merged.map((m) => [m.id, m])).values()
    );
    const pendingMessages = optimisticMessages.filter((message) => {
      if (message.isTyping) return true;
      return !serverMessages.some(
        (serverMessage) =>
          serverMessage.role === message.role &&
          serverMessage.content === message.content
      );
    });
    const combinedMessages = [...serverMessages, ...pendingMessages];
    return combinedMessages.length > 0
      ? combinedMessages
      : [
          {
            id: 1,
            role: "ai",
            content:
              "Xin chào! Tôi là **LifeHealth MedAI** — Trợ lý y tế thông minh của nền tảng LifeHealth. Tôi có thể hỗ trợ giải đáp thắc mắc sức khỏe hoặc hướng dẫn chăm sóc y tế cho bạn hôm nay như thế nào?",
          },
        ];
  }, [data, optimisticMessages]);

  useEffect(() => {
    if (!userInfo) {
      navigate("/sign-in");
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    const viewport = scrollAreaWrapperRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]'
    );
    viewportRef.current = viewport ?? null;
  }, []);

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
  }, [handleScroll]);

  const handleInputContent = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const clearTypingInterval = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isPending || !userId) return;

    const question = input;
    setInput("");
    setIsPending(true);

    const tempId = Date.now();
    const startTime = Date.now();

    setOptimisticMessages((prev) => [
      ...prev,
      { id: tempId, content: question, role: "human" },
      {
        id: tempId + 1,
        content: "",
        role: "ai",
        isTyping: true,
        startTypingAt: startTime,
        elapsed: 0,
      },
    ]);

    typingIntervalRef.current = setInterval(() => {
      setOptimisticMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId + 1
            ? {
                ...msg,
                elapsed: (Date.now() - (msg.startTypingAt ?? Date.now())) / 1000,
              }
            : msg
        )
      );
    }, 100);

    try {
      await sendChatbotMessage(question);
      clearTypingInterval();
      setOptimisticMessages((prev) =>
        prev.filter((msg) => msg.id !== tempId + 1)
      );
      await queryClient.invalidateQueries({
        queryKey: ["messages-chatbot", userId],
      });
    } catch (error) {
      clearTypingInterval();
      setOptimisticMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId + 1
            ? {
                ...msg,
                isTyping: false,
                content: "Không thể lấy phản hồi từ chatbot. Vui lòng thử lại.",
              }
            : msg
        )
      );
      console.error("Chatbot request failed:", error);
    } finally {
      setIsPending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="w-full h-full flex justify-center items-center overflow-hidden">
      <Card className="w-full max-w-3xl h-full flex flex-col gap-0 p-0 overflow-hidden rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="shrink-0 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/logo.jpg"
                alt="LifeHealth Logo"
                className="size-11 object-cover rounded-2xl shadow-xs border border-primary/20"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg flex items-center gap-1.5">
                  LifeHealth MedAI
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4 text-sky-500"
                  >
                    <path d="M22.5 12c0 5.79-4.71 10.5-10.5 10.5S1.5 17.79 1.5 12 6.21 1.5 12 1.5 22.5 6.21 22.5 12zM10.94 17.25l7.31-7.31-1.06-1.06-6.25 6.25-2.81-2.81-1.06 1.06 3.87 3.87z" />
                  </svg>
                </h1>
                <span className="rounded-md bg-gradient-to-r from-emerald-500/15 to-teal-500/15 dark:from-emerald-500/25 dark:to-teal-500/25 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Official AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Trợ lý Y tế Thông minh LifeHealth • Trực tuyến 24/7
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Mandatory Amber Medical Disclaimer */}
        <div className="shrink-0 px-4 py-2 bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-900/60 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="leading-tight text-[11px] sm:text-xs">
            <strong>Khuyến cáo y khoa:</strong> Trợ lý AI chỉ mang tính tham khảo sơ bộ, không thay thế chẩn đoán hay chỉ định điều trị từ bác sĩ chuyên môn.
          </p>
        </div>

        <CardContent className="flex-1 min-h-0 p-0 bg-slate-50/60 dark:bg-slate-950/40 overflow-hidden">
          <div ref={scrollAreaWrapperRef} className="h-full w-full overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className="p-3 sm:p-4 space-y-3.5">
                {messages.map(({ id, content, role, isTyping, elapsed }) => (
                  <div
                    key={id}
                    className={`flex items-start gap-3 ${
                      role === "human" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {/* Avatar Bot — Robot AI Y tế */}
                    {role === "ai" && (
                      <div className="relative shrink-0">
                        {isTyping && (
                          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                        )}
                        <Avatar className="relative w-9 h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                          <AvatarImage src="" alt="Bot" />
                          <AvatarFallback>
                            <MedicalRobotAvatar active={!!isTyping} />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`max-w-[80%] min-w-0 px-4 py-2.5 rounded-2xl break-words text-sm md:text-base shadow-xs
                        ${
                          role === "human"
                            ? "bg-primary text-white rounded-br-none whitespace-pre-wrap font-medium"
                            : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none"
                        }`}
                    >
                      {isTyping ? (
                        <MedicalAILoading elapsed={elapsed ?? 0} />
                      ) : role === "human" ? (
                        content
                      ) : (
                        <MarkdownMessage content={content} />
                      )}
                    </div>

                    {/* Avatar User */}
                    {role === "human" && (
                      <Avatar className="w-9 h-9 bg-primary/10 border border-primary/20 shadow-xs shrink-0">
                        <AvatarImage src={userInfo?.picture || ""} alt="Bạn" />
                        <AvatarFallback className="font-bold text-primary text-xs">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>

        {/* Input */}
        <CardFooter className="shrink-0 p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2.5">
          <Input
            value={input}
            onInput={handleInputContent}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:ring-primary/20"
            placeholder={isPending ? "Trợ lý AI đang suy nghĩ và soạn câu trả lời..." : "Nhập câu hỏi hoặc tình trạng sức khỏe của bạn..."}
          />
          <Button
            disabled={isPending || !input.trim()}
            onClick={handleSend}
            className="rounded-xl px-5 bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-xs cursor-pointer gap-1.5"
          >
            {isPending ? (
              <Loading size={10} />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Gửi</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
