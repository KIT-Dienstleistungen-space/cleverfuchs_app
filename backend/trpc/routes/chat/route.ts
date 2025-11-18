import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]).default("user"),
  content: z.string().min(1, "Inhalt erforderlich"),
});

const chatInputSchema = z.object({
  profileId: z.string().min(1),
  chatId: z.string().min(1),
  messages: z.array(chatMessageSchema).min(1),
});

type ProviderResponse = {
  choices?: { message?: { content?: string } }[];
  model?: string;
  usage?: Record<string, unknown>;
};

const buildHeaders = (apiKey: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
};

const mapProviderResponse = (data: ProviderResponse, fallbackModel: string) => {
  const content =
    data?.choices?.[0]?.message?.content?.trim() ??
    "Ich konnte leider keine Antwort erzeugen.";

  return {
    message: {
      role: "assistant" as const,
      content,
    },
    model: data?.model ?? fallbackModel,
    usage: data?.usage ?? null,
  };
};

export default publicProcedure
  .input(chatInputSchema)
  .mutation(async ({ input }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    const endpoint =
      process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1/chat/completions";
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    if (!apiKey) {
      return {
        message: {
          role: "assistant" as const,
          content:
            "Es ist kein Sprachmodell hinterlegt. Bitte konfiguriere OPENAI_API_KEY.",
        },
        model: "unconfigured",
        usage: null,
      };
    }

    const payload = {
      model,
      messages: input.messages,
      temperature: 0.7,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: buildHeaders(apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      throw new Error(
        `LLM-Antwort fehlgeschlagen (${response.status}): ${errorPayload}`
      );
    }

    const data = (await response.json()) as ProviderResponse;

    return mapProviderResponse(data, model);
  });
