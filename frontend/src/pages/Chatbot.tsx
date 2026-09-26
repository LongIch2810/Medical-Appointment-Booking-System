import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, MessageSquarePlus, PanelLeft, RefreshCw } from "lucide-react";
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
import PatientPromptTemplatesDialog from "@/components/chatbot/PatientPromptTemplatesDialog";
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
  const {
    data: conversationPage,
    isLoading: isLoadingConversations,
    isError: isConversationError,
    refetch: refetchConversations,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePatientChatConversations(Boolean(userId));
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [isPromptTemplatesOpen, setIsPromptTemplatesOpen] = useState(false);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [liveTurn, setLiveTurn] = useState<{
    conversationId: number;
    messages: PatientChatMessage[];
  } | null>(null);
  const [optimisticUser, setOptimisticUser] = useState<{
    conversationId: number | null;
    content: string;
  } | null>(null);
  const [failedRequest, setFailedRequest] = useState<FailedRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initializedSelection = useRef(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const transcriptWrapperRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);

  // Timer counting elapsed seconds while isPending is true
  useEffect(() => {
    if (!isPending) {
      setElapsedSeconds(0);
      return;
    }
    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPending]);

  const conversations = useMemo(() => {
    return conversationPage?.pages.flatMap((page) => page.conversations) ?? [];
  }, [conversationPage]);
  const detailQuery = usePatientChatConversation(activeConversationId);
  const createConversation = useCreatePatientChatConversation();
  const sendMessage = useSendPatientChatMessage();
  const deleteConversation = useDeletePatientChatConversation();
  const pages = detailQuery.data?.pages;
  const persistedMessages = useMemo(() => {
    const all = (pages ?? []).slice().reverse().flatMap((page) => page.messages);
    return Array.from(new Map(all.map((message) => [message.id, message])).values()).sort(
      (left, right) => left.id - right.id,
    );
  }, [pages]);
  const activeConversation: PatientChatConversation | undefined = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );
  const messages = useMemo(() => {
    const all = [...persistedMessages];
    if (liveTurn?.conversationId === activeConversationId) all.push(...liveTurn.messages);
    return Array.from(new Map(all.map((message) => [message.id, message])).values()).sort(
      (left, right) => left.id - right.id,
    );
  }, [persistedMessages, liveTurn, activeConversationId]);
  const latestMessageId = messages.at(-1)?.id;
  const activeOptimisticUser =
    optimisticUser && optimisticUser.conversationId === activeConversationId
      ? optimisticUser.content
      : null;
  const isBusy = isPending || createConversation.isPending || deleteConversation.isPending;
  const latestMessage = messages.at(-1);
  const retryDecision =
    latestMessage?.role === "USER" &&
    (latestMessage.payload?.decision === "APPROVE" ||
      latestMessage.payload?.decision === "CANCEL") &&
    typeof latestMessage.payload.approvalMessageId === "number"
      ? {
          approvalMessageId: latestMessage.payload.approvalMessageId,
          decision: latestMessage.payload.decision as "APPROVE" | "CANCEL",
        }
      : null;
  const latestApproval =
    latestMessage?.role === "ASSISTANT" && latestMessage.action === "BOOKING_APPROVAL"
      ? latestMessage
      : retryDecision
        ? messages.find(
            (message) =>
              message.id === retryDecision.approvalMessageId &&
              message.action === "BOOKING_APPROVAL",
          )
        : undefined;

  useEffect(() => {
    if (!userInfo) navigate("/sign-in");
  }, [userInfo, navigate]);

  useEffect(() => {
    if (initializedSelection.current || isLoadingConversations || !conversationPage) return;
    initializedSelection.current = true;
    if (conversations[0]) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, conversationPage, isLoadingConversations]);

  useEffect(() => {
    setLiveTurn(null);
    setOptimisticUser(null);
    setFailedRequest(null);
    setErrorMessage(null);
    isNearBottomRef.current = true;
  }, [activeConversationId]);

  useEffect(() => {
    viewportRef.current =
      transcriptWrapperRef.current?.querySelector<HTMLDivElement>(
        '[data-slot="scroll-area-viewport"]',
      ) ?? null;
  }, [activeConversationId, messages.length]);

  const checkScrollPosition = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const threshold = 120;
    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const nearBottom = distanceFromBottom <= threshold;
    isNearBottomRef.current = nearBottom;
    setShowScrollBottomBtn(!nearBottom && messages.length > 2);
  };

  const scrollToBottom = (smooth = true) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const behavior =
      smooth &&
      !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ? "smooth"
        : "auto";
    if (typeof viewport.scrollTo === "function") {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    } else {
      viewport.scrollTop = viewport.scrollHeight;
    }
    isNearBottomRef.current = true;
    setShowScrollBottomBtn(false);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (isNearBottomRef.current || activeOptimisticUser !== null || isPending) {
      scrollToBottom(true);
    }
  }, [latestMessageId, activeConversationId, activeOptimisticUser, isPending]);

  const handleFillPrompt = (prompt: string) => {
    setInput(prompt);
    composerRef.current?.focus();
  };

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
      composerRef.current?.focus();
    } catch {
      setErrorMessage("Không thể tạo cuộc trò chuyện mới. Vui lòng thử lại.");
    }
  };

  const runTurn = useCallback(
    async (
      conversationId: number,
      body: PatientChatRequest,
      optimisticContent: string,
      showOptimisticUser = true,
    ) => {
      setIsPending(true);
      setErrorMessage(null);
      setFailedRequest(null);
      setOptimisticUser(showOptimisticUser ? { conversationId, content: optimisticContent } : null);
      isNearBottomRef.current = true;
      try {
        const turn = await sendMessage.mutateAsync({ conversationId, body });
        const newMessages = [
          ...(turn.userMessage ? [turn.userMessage] : []),
          turn.assistantMessage,
        ];
        setLiveTurn({ conversationId, messages: newMessages });
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: patientChatQueryKeys.conversation(conversationId),
          }),
          queryClient.invalidateQueries({ queryKey: patientChatQueryKeys.conversations }),
        ]);
        setLiveTurn(null);
        setOptimisticUser(null);
      } catch {
        setOptimisticUser(null);
        setFailedRequest({ conversationId, body, optimisticContent });
        setErrorMessage(
          "Không nhận được phản hồi từ trợ lý. Nếu yêu cầu đã tới backend thì tin nhắn vẫn được giữ; bạn có thể thử lại.",
        );
        await queryClient.invalidateQueries({
          queryKey: patientChatQueryKeys.conversation(conversationId),
        });
      } finally {
        setIsPending(false);
      }
    },
    [queryClient, sendMessage],
  );

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

  const handleBookingDecision = async (
    approvalMessageId: number,
    decision: "APPROVE" | "CANCEL",
  ) => {
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
    if (!viewport) return;
    checkScrollPosition();
    if (viewport.scrollTop > 30 || !detailQuery.hasNextPage || detailQuery.isFetchingNextPage)
      return;
    const previousHeight = viewport.scrollHeight;
    await detailQuery.fetchNextPage();
    requestAnimationFrame(() => {
      if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight - previousHeight;
      }
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
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={() => void fetchNextPage()}
    />
  );

  return (
    <section className="flex h-full min-h-0 w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-xs lg:flex-row">
      <aside className="hidden min-h-0 w-72 shrink-0 overflow-hidden border-r border-border/80 bg-card lg:flex lg:flex-col">
        {isLoadingConversations ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <Loading size={24} />
          </div>
        ) : isConversationError ? (
          <div className="flex flex-1 items-center justify-center p-4">
            <ErrorState
              description="Không tải được danh sách cuộc trò chuyện."
              onRetry={() => void refetchConversations()}
            />
          </div>
        ) : (
          renderConversationList()
        )}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <header className="shrink-0 border-b border-border/80 px-3 sm:px-5">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Mở danh sách cuộc trò chuyện"
              onClick={() => setMobileRailOpen(true)}
            >
              <PanelLeft className="size-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <ChatHeader />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden min-h-9 gap-1.5 rounded-xl font-semibold sm:inline-flex lg:hidden cursor-pointer"
              onClick={() => void openNewConversation()}
              disabled={isBusy}
            >
              <MessageSquarePlus className="size-4" />
              <span>Mới</span>
            </Button>
          </div>
          <div className="pb-3 pt-0.5">
            <MedicalDisclaimer />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          {activeConversationId !== null && detailQuery.isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loading size={28} />
            </div>
          ) : activeConversationId !== null && detailQuery.isError ? (
            <div className="flex h-full items-center justify-center p-5">
              <ErrorState
                description="Không tải được nội dung cuộc trò chuyện."
                onRetry={() => void detailQuery.refetch()}
              />
            </div>
          ) : messages.length === 0 && !activeOptimisticUser ? (
            <div className="h-full min-h-0 overflow-y-auto">
              <WelcomeState
                onQuickAction={(prompt) => void handleSend(prompt)}
                onFillPrompt={handleFillPrompt}
              />
            </div>
          ) : (
            <div ref={transcriptWrapperRef} className="relative h-full overflow-hidden flex flex-col justify-between">
              <ScrollArea className="h-full" onScrollCapture={() => void handleScroll()}>
                <div className="mx-auto w-full max-w-4xl space-y-4 px-3 py-4 sm:space-y-5 sm:px-6 sm:py-6">
                  {detailQuery.hasNextPage && (
                    <div className="flex justify-center pb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-9 gap-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                        onClick={() => void detailQuery.fetchNextPage()}
                        disabled={detailQuery.isFetchingNextPage}
                      >
                        <RefreshCw
                          className={`size-3.5 ${
                            detailQuery.isFetchingNextPage ? "animate-spin" : ""
                          }`}
                        />
                        <span>
                          {detailQuery.isFetchingNextPage ? "Đang tải…" : "Tải tin nhắn cũ hơn"}
                        </span>
                      </Button>
                    </div>
                  )}

                  {messages.map((message) =>
                    message.role === "USER" ? (
                      <UserMessage
                        key={message.id}
                        content={
                          message.payload?.decision === "APPROVE"
                            ? "Đã bấm nút xác nhận đặt lịch"
                            : message.payload?.decision === "CANCEL"
                              ? "Đã bấm nút hủy yêu cầu đặt lịch"
                              : message.content
                        }
                        createdAt={message.createdAt}
                      />
                    ) : (
                      <div key={message.id} className="space-y-3">
                        <AssistantMessage
                          content={message.content}
                          createdAt={message.createdAt}
                          action={message.action}
                        />
                        {message.action === "BOOKING_APPROVAL" && (
                            <div className="pl-0 sm:pl-7">
                              <BookingApprovalCard
                                message={message}
                                isPendingApproval={message.id === latestApproval?.id}
                                retryDecision={
                                  message.id === latestApproval?.id
                                    ? retryDecision?.decision ?? null
                                    : null
                                }
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
                    ),
                  )}

                  {activeOptimisticUser && <UserMessage content={activeOptimisticUser} />}

                  {isPending && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <AssistantMessage
                        content=""
                        isTyping={true}
                        elapsed={elapsedSeconds}
                      />
                    </div>
                  )}

                  <div aria-live="polite" className="sr-only">
                    {isPending ? "Trợ lý đang xử lý câu trả lời" : ""}
                  </div>
                </div>
              </ScrollArea>

              {/* Floating scroll to bottom button */}
              {showScrollBottomBtn && (
                <div className="sticky bottom-3 left-0 right-0 z-20 flex justify-center pointer-events-none pb-1 animate-in fade-in zoom-in-95 duration-200">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => scrollToBottom(true)}
                    className="pointer-events-auto h-8.5 gap-1.5 rounded-full bg-slate-900/90 px-3.5 text-xs font-semibold text-white shadow-md hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white cursor-pointer active:scale-95 transition-all"
                    aria-label="Cuộn xuống tin nhắn mới nhất"
                  >
                    <ArrowDown className="size-3.5" aria-hidden="true" />
                    <span>Tin mới nhất</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mx-3 mb-2 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs sm:text-sm text-destructive sm:mx-5"
          >
            <span className="min-w-0 flex-1 leading-relaxed">{errorMessage}</span>
            {failedRequest && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-9 shrink-0 border-destructive/40 font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
                disabled={isBusy}
                onClick={() =>
                  void runTurn(
                    failedRequest.conversationId,
                    failedRequest.body,
                    failedRequest.optimisticContent,
                    false,
                  )
                }
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
          onOpenTemplates={() => setIsPromptTemplatesOpen(true)}
        />
        <div className="sr-only" aria-live="polite">
          {activeConversation ? `Đang xem ${activeConversation.title}` : "Cuộc trò chuyện mới"}
        </div>
      </div>

      <PatientPromptTemplatesDialog
        open={isPromptTemplatesOpen}
        onOpenChange={setIsPromptTemplatesOpen}
        onSendPrompt={(prompt) => void handleSend(prompt)}
        onFillPrompt={handleFillPrompt}
        disabled={isBusy}
      />

      <Sheet open={mobileRailOpen} onOpenChange={setMobileRailOpen}>
        <SheetContent side="left" className="p-0 flex flex-col">
          <SheetHeader className="border-b border-border/80 p-4 pr-12 text-left">
            <SheetTitle className="font-heading">Cuộc trò chuyện</SheetTitle>
            <SheetDescription className="text-xs">
              Chọn một cuộc trò chuyện hoặc bắt đầu cuộc trò chuyện mới.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-hidden">{renderConversationList()}</div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
