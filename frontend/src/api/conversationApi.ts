import axiosInstance from "@/configs/axios";
import type {
  PatientChatConversation,
  PatientChatConversationDetail,
  PatientChatConversationPage,
  PatientChatTurnResponse,
} from "@/types/interface/patientChat.interface";

export const getMessagesChatbot = async (userId: number, page: number = 1) => {
  const res = await axiosInstance.get(`/chat-history/${userId}?page=${page}`);
  return res.data;
};

export const sendChatbotMessage = async (question: string) => {
  const res = await axiosInstance.post("/chat-history/chat", { question });
  return res.data.data.answer as string;
};

export const createPatientChatConversation = async () => {
  const res = await axiosInstance.post("/chat-history/conversations");
  return res.data.data as PatientChatConversation;
};

export const listPatientChatConversations = async (page = 1, limit = 50) => {
  const res = await axiosInstance.get("/chat-history/conversations", {
    params: { page, limit },
  });
  return res.data.data as PatientChatConversationPage;
};

export const getPatientChatConversation = async (
  conversationId: number,
  beforeMessageId?: number,
  limit = 50,
) => {
  const res = await axiosInstance.get(
    `/chat-history/conversations/${conversationId}`,
    { params: { beforeMessageId, limit } },
  );
  return res.data.data as PatientChatConversationDetail;
};

export const deletePatientChatConversation = async (conversationId: number) => {
  const res = await axiosInstance.delete(
    `/chat-history/conversations/${conversationId}`,
  );
  return res.data.data as { success: boolean };
};

export const sendPatientChatMessage = async (
  conversationId: number,
  body: { message: string } | { approvalMessageId: number; decision: "APPROVE" | "CANCEL" },
) => {
  const res = await axiosInstance.post(
    `/chat-history/conversations/${conversationId}/messages`,
    body,
  );
  return res.data.data as PatientChatTurnResponse;
};
