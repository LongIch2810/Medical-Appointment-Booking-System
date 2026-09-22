import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Menu, Plus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/store/useUserStore";
import ErrorState from "@/components/notification/ErrorState";
import Loading from "@/components/loading/Loading";
import ChatHeader from "@/components/chatbot/ChatHeader";
import MedicalDisclaimer from "@/components/chatbot/MedicalDisclaimer";
import WelcomeState from "@/components/chatbot/WelcomeState";
import AssistantMessage from "@/components/chatbot/AssistantMessage";
import UserMessage from "@/components/chatbot/UserMessage";
import ChatComposer from "@/components/chatbot/ChatComposer";
import PatientChatConversationList from "@/components/chatbot/PatientChatConversationList";
import BookingApprovalCard from "@/components/chatbot/BookingApprovalCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  patientChatQueryKeys,
  useCreatePatientChatConversation,
  useDeletePatientChatConversation,
  usePatientChatConversation,
  usePatientChatConversations,
  useSendPatientChatMessage,
} from "@/hooks/usePatientChat";
import type {
  PatientChatConversation,
  PatientChatMessage,
} from "@/types/interface/patientChat.interface";

type PatientChatRequest =
  | { message: string }
  | { approvalMessageId: number; decision: "APPROVE" | "CANCEL" };

type FailedRequest = {
  conversationId: number;
  body: PatientChatRequest;
  optimisticContent: string;
};

export default function Chatbot() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userInfo } = useUserStore();
  const userId = userInfo?.id ?? 0;
  const { data: conversationPage, isLoading: isLoadingConversations, isError: isConversationError, refetch: refetchConversations } =
    usePatientChatConversations(Boolean(userId));
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [liveTurn, setLiveTurn] = useState<{ conversationId: number; messages: PatientChatMessage[] } | null>(null);
  const [optimisticUser, setOptimisticUser] = useState<{ conversationId: number | null; content: string } | null>(null);
  const [failedRequest, setFailedRequest] = useState<FailedRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initializedSelection = useRef(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const transcriptWrapperRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const conversations = conversationPage?.conversations ?? [];
  const detailQuery = usePatientChatConversation(activeConversationId);
  const createConversation = useCreatePatientChatConversation();
  const sendMessage = useSendPatientChatMessage();
  const deleteConversation = useDeletePatientChatConversation();
  const pages = detailQuery.data?.pages;
  const persistedMessages = useMemo(() => {
    const all = (pages ?? []).slice().reverse().flatMap((page) => page.messages);
    return Array.from(new Map(all.map((message) => [message.id, message])).values())
      .sort((left, right) => left.id - right.id);
  }, [pages]);
  const activeConversation: PatientChatConversation | undefined = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );
  const messages = useMemo(() => {
    const all = [...persistedMessages];
    if (liveTurn?.conversationId === activeConversationId) all.push(...liveTurn.messages);
    return Array.from(new Map(all.map((message) => [message.id, message])).values())
      .sort((left, right) => left.id - right.id);
  }, [persistedMessages, liveTurn, activeConversationId]);
  const latestMessageId = messages.at(-1)?.id;
  const activeOptimisticUser = optimisticUser && optimisticUser.conversationId === activeConversationId
    ? optimisticUser.content
    : null;
  const isBusy = isPending || createConversation.isPending || deleteConversation.isPending;
  const latestMessage = messages.at(-1);
  const latestApproval = latestMessage?.role === "ASSISTANT" && latestMessage.action === "BOOKING_APPROVAL"
    ? latestMessage
    : undefined;

  useEffect(() => {
    if (!userInfo) navigate("/sign-in");
  }, [userInfo, navigate]);

  useEffect(() => {
    if (initializedSelection.current || isLoadingConversations || !conversationPage) return;
    initializedSelection.current = true;
    if (conversationPage.conversations[0]) {
      setActiveConversationId(conversationPage.conversations[0].id);
    }
  }, [conversationPage, isLoadingConversations]);

  useEffect(() => {
    setLiveTurn(null);
    setOptimisticUser(null);
    setFailedRequest(null);
    setErrorMessage(null);
  }, [activeConversationId]);

  useEffect(() => {
    viewportRef.current = transcriptWrapperRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]',
    ) ?? null;
  }, [activeConversationId, messages.length]);

  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
  }, [latestMessageId, activeConversationId, activeOptimisticUser, isPending]);

  const openNewConversation = async () => {
    if (isBusy) return;
    setErrorMessage(null);
    setFailedRequest(null);
    try {
      const conversation = await createConversation.mutateAsync();
      initializedSelection.current = true;
      setActiveConversationId(conversation.id);
      setMobileRailOpen(false);
      await queryClient.invalidateQueries({ queryKey: patientChatQueryKeys.conversations });
    } catch {
      setErrorMessage("Không thể tạo cuộc trò chuyện mới. Vui lòng thử lại.");
    }
  };

  const runTurn = useCallback(async (
    conversationId: number,
    body: PatientChatRequest,
    optimisticContent: string,
    showOptimisticUser = true,
  ) => {
    setIsPending(true);
    setErrorMessage(null);
    setFailedRequest(null);
    setOptimisticUser(showOptimisticUser ? { conversationId, content: optimisticContent } : null);
    try {
      const turn = await sendMessage.mutateAsync({ conversationId, body });
      const newMessages = [
        ...(turn.userMessage ? [turn.userMessage] : []),
        turn.assistantMessage,
      ];
      setLiveTurn({ conversationId, messages: newMessages });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: patientChatQueryKeys.conversation(conversationId) }),
        queryClient.invalidateQueries({ queryKey: patientChatQueryKeys.conversations }),
      ]);
      setLiveTurn(null);
      setOptimisticUser(null);
    } catch {
      setOptimisticUser(null);
      setFailedRequest({ conversationId, body, optimisticContent });
      setErrorMessage("Không nhận được phản hồi từ trợ lý. Nếu yêu cầu đã tới backend thì tin nhắn vẫn được giữ; bạn có thể thử lại.");
      await queryClient.invalidateQueries({ queryKey: patientChatQueryKeys.conversation(conversationId) });
    } finally {
      setIsPending(false);
    }
  }, [queryClient, sendMessage]);

  const handleSend = async (prompt?: string) => {
    const content = (prompt ?? input).trim();
    if (!content || isBusy || !userId) return;
    setInput("");
    let conversationId = activeConversationId;
    if (conversationId === null) {
      try {
        const conversation = await createConversation.mutateAsync();
        conversationId = conversation.id;
        initializedSelection.current = true;
        setActiveConversationId(conversation.id);
      } catch {
        setErrorMessage("Không thể tạo cuộc trò chuyện. Vui lòng thử lại.");
        return;
      }
    }
    setMobileRailOpen(false);
    await runTurn(conversationId, { message: content }, content);
  };

  const handleBookingDecision = async (approvalMessageId: number, decision: "APPROVE" | "CANCEL") => {
    if (activeConversationId === null || isBusy) return;
    const label = decision === "APPROVE" ? "Xác nhận đặt lịch" : "Hủy yêu cầu đặt lịch";
    await runTurn(activeConversationId, { approvalMessageId, decision }, label);
  };

  const handleSelectConversation = (id: number) => {
    if (isBusy) return;
    setActiveConversationId(id);
    setMobileRailOpen(false);
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await deleteConversation.mutateAsync(id);
      if (activeConversationId === id) setActiveConversationId(null);
      setErrorMessage(null);
    } catch {
      setErrorMessage("Không thể xóa cuộc trò chuyện. Vui lòng thử lại.");
    }
  };

  const handleScroll = async () => {
    const viewport = viewportRef.current;
    if (!viewport || viewport.scrollTop > 24 || !detailQuery.hasNextPage || detailQuery.isFetchingNextPage) return;
    const previousHeight = viewport.scrollHeight;
    await detailQuery.fetchNextPage();
    requestAnimationFrame(() => {
      if (viewportRef.current) viewportRef.current.scrollTop = viewportRef.current.scrollHeight - previousHeight;
    });
  };

  const renderConversationList = () => (
    <PatientChatConversationList
      conversations={conversations}
      activeConversationId={activeConversationId}
      isBusy={isBusy}
      onNewConversation={() => void openNewConversation()}
      onSelectConversation={handleSelectConversation}
      onDeleteConversation={(id) => void handleDeleteConversation(id)}
    />
  );

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-background lg:flex-row lg:gap-3">
      <aside className="hidden min-h-0 w-72 shrink-0 overflow-hidden rounded-2xl border border-border bg-card lg:flex">
        {isLoadingConversations ? (
          <div className="flex flex-1 items-center justify-center"><Loading size={24} /></div>
        ) : isConversationError ? (
          <div className="flex flex-1 items-center justify-center p-4">
            <ErrorState description="Không tải được danh sách cuộc trò chuyện." onRetry={() => void refetchConversations()} />
          </div>
        ) : renderConversationList()}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <header className="shrink-0 border-b border-border px-3 sm:px-5">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 lg:hidden"
              aria-label="Mở danh sách cuộc trò chuyện"
              onClick={() => setMobileRailOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0 flex-1"><ChatHeader /></div>
            <Button
              type="button"
              variant="outline"
              className="hidden min-h-11 sm:inline-flex lg:hidden"
              onClick={() => void openNewConversation()}
              disabled={isBusy}
            >
              <Plus className="size-4" />
              Mới
            </Button>
          </div>
          <div className="pb-3"><MedicalDisclaimer /></div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          {activeConversationId !== null && detailQuery.isLoading ? (
            <div className="flex h-full items-center justify-center"><Loading size={28} /></div>
          ) : activeConversationId !== null && detailQuery.isError ? (
            <div className="flex h-full items-center justify-center p-5">
              <ErrorState description="Không tải được nội dung cuộc trò chuyện." onRetry={() => void detailQuery.refetch()} />
            </div>
          ) : messages.length === 0 && !activeOptimisticUser ? (
            <div className="h-full min-h-0 overflow-y-auto">
              <WelcomeState onQuickAction={(prompt) => void handleSend(prompt)} />
            </div>
          ) : (
            <div ref={transcriptWrapperRef} className="h-full overflow-hidden">
              <ScrollArea className="h-full" onScrollCapture={() => void handleScroll()}>
                <div className="mx-auto w-full max-w-4xl space-y-5 px-3 py-5 sm:px-6">
                  {detailQuery.hasNextPage && (
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11"
                        onClick={() => void detailQuery.fetchNextPage()}
                        disabled={detailQuery.isFetchingNextPage}
                      >
                        <RefreshCw className="size-4" />
                        {detailQuery.isFetchingNextPage ? "Đang tải…" : "Tải tin nhắn cũ hơn"}
                      </Button>
                    </div>
                  )}
                  {messages.map((message) => (
                    message.role === "USER" ? (
                      <UserMessage key={message.id} content={message.content} />
                    ) : (
                      <div key={message.id}>
                        <AssistantMessage content={message.content} />
                        {message.action === "BOOKING_APPROVAL" && message.id === latestApproval?.id && (
                          <div className="pl-0 sm:pl-6">
                            <BookingApprovalCard
                              message={message}
                              isBusy={isBusy}
                              onApprove={(id) => void handleBookingDecision(id, "APPROVE")}
                              onCancel={(id) => void handleBookingDecision(id, "CANCEL")}
                              onEdit={() => {
                                setErrorMessage(null);
                                composerRef.current?.focus();
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  ))}
                  {activeOptimisticUser && <UserMessage content={activeOptimisticUser} />}
                  {isPending && (
                    <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Bot className="size-4 text-primary" aria-hidden="true" />
                      Đang xử lý yêu cầu của bạn…
                    </div>
                  )}
                  <div aria-live="polite" className="sr-only">{isPending ? "Trợ lý đang xử lý" : ""}</div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {errorMessage && (
          <div role="alert" className="mx-3 mb-2 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive sm:mx-5">
            <span>{errorMessage}</span>
            {failedRequest && (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0"
                disabled={isBusy}
                onClick={() => void runTurn(failedRequest.conversationId, failedRequest.body, failedRequest.optimisticContent, false)}
              >
                Thử lại
              </Button>
            )}
          </div>
        )}

        <ChatComposer
          value={input}
          onChange={setInput}
          onSend={() => void handleSend()}
          isPending={isBusy}
          textareaRef={composerRef}
        />
        <div className="sr-only" aria-live="polite">
          {activeConversation ? `Đang xem ${activeConversation.title}` : "Cuộc trò chuyện mới"}
        </div>
      </div>

      <Sheet open={mobileRailOpen} onOpenChange={setMobileRailOpen}>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="border-b border-border pr-12">
            <SheetTitle>Cuộc trò chuyện</SheetTitle>
            <SheetDescription>Chọn một cuộc trò chuyện hoặc bắt đầu cuộc trò chuyện mới.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1">{renderConversationList()}</div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
