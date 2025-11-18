import { describe, expect, mock, test } from "bun:test";
import type { Message } from "../../contexts/ProfileContext";

process.env.EXPO_PUBLIC_RORK_API_BASE_URL ??= "http://localhost:8787";

const {
  ChatClient,
  buildChatRequest,
  mapMessagesToPayload,
  sanitizeContent,
} = await import("./chat");

type ChatRequest = import("./chat").ChatRequest;

describe("chat api helpers", () => {
  test("trims message content", () => {
    expect(sanitizeContent(" Hallo ")).toBe("Hallo");
  });

  test("filters out empty messages and keeps order", () => {
    const messages: Message[] = [
      { id: "1", role: "user", content: "  Hi  ", timestamp: 0 },
      { id: "2", role: "assistant", content: "", timestamp: 0 },
      { id: "3", role: "user", content: "Wie geht's?", timestamp: 0 },
    ];

    const payload = mapMessagesToPayload(messages);

    expect(payload).toEqual([
      { role: "user", content: "Hi" },
      { role: "user", content: "Wie geht's?" },
    ]);
  });

  test("builds a chat request", () => {
    const messages: Message[] = [
      { id: "1", role: "user", content: "Hallo", timestamp: 0 },
    ];

    expect(buildChatRequest("profile-1", "chat-1", messages)).toEqual({
      profileId: "profile-1",
      chatId: "chat-1",
      messages: [{ role: "user", content: "Hallo" }],
    });
  });
});

describe("ChatClient", () => {
  test("delegates to the provided transport", async () => {
    const payload: ChatRequest = {
      profileId: "p-1",
      chatId: "c-1",
      messages: [{ role: "user", content: "Hi" }],
    };

    const transport = {
      chat: {
        mutate: mock(() =>
          Promise.resolve({
            message: { role: "assistant" as const, content: "Hallo" },
            model: "test-model",
            usage: null,
          })
        ),
      },
    };

    const client = new ChatClient(transport);
    const response = await client.sendMessage(payload);

    expect(transport.chat.mutate).toHaveBeenCalledWith(payload);
    expect(response.message.content).toBe("Hallo");
  });
});
