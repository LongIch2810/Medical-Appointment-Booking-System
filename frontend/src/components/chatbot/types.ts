export type Role = "human" | "ai";

export interface ChatMessage {
  id: number;
  content: string;
  role: Role;
  isTyping?: boolean;
  startTypingAt?: number;
  elapsed?: number;
  isError?: boolean;
  retryQuestion?: string;
}
