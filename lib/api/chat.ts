import type { Message } from "@/contexts/ProfileContext";
import { trpcClient } from "@/lib/trpc";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatPayloadMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  profileId: string;
  chatId: string;
  messages: ChatPayloadMessage[];
}

export interface ChatResponse {
  message: ChatPayloadMessage;
  model: string;
  usage: Record<string, unknown> | null;
}

export const sanitizeContent = (content: string) => content.trim();

export const mapMessagesToPayload = (messages: Message[]): ChatPayloadMessage[] =>
  messages
    .filter((message) => Boolean(message.content?.trim()))
    .map((message) => ({
      role: message.role,
      content: sanitizeContent(message.content),
    }));

export const buildChatRequest = (
  profileId: string,
  chatId: string,
  messages: Message[]
): ChatRequest => ({
  profileId,
  chatId,
  messages: mapMessagesToPayload(messages),
});

interface ChatClientTransport {
  chat: {
    mutate: (payload: ChatRequest) => Promise<ChatResponse>;
  };
}

export class ChatClient {
  constructor(private readonly transport: ChatClientTransport = trpcClient) {}

  async sendMessage(payload: ChatRequest) {
    return this.transport.chat.mutate(payload);
  }
}

export const chatClient = new ChatClient();
