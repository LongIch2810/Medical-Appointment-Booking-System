import axiosInstance from "@/configs/axios";

export const getMessagesChatbot = async (userId: number, page: number = 1) => {
  const res = await axiosInstance.get(`/chat-history/${userId}?page=${page}`);
  return res.data;
};

export const sendChatbotMessage = async (question: string) => {
  const res = await axiosInstance.post("/chat-history/chat", { question });
  return res.data.data.answer as string;
};
