import { protectedProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { db } from "@/backend/db/users";
import { generateText } from "@rork-ai/toolkit-sdk";
import { TRPCError } from "@trpc/server";

type ImagePart = { type: "image"; image: string };
type TextPart = { type: "text"; text: string };
type UserMessage = { role: "user"; content: string | (TextPart | ImagePart)[] };
type AssistantMessage = { role: "assistant"; content: string | TextPart[] };

export const chatProcedure = protectedProcedure
  .input(
    z.object({
      chatId: z.string(),
      message: z.string(),
      imageBase64: z.string().optional(),
      languageLevel: z.enum(["beginner", "intermediate", "advanced"]),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const chat = await db.chats.findById(input.chatId);
    
    if (!chat) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Chat nicht gefunden",
      });
    }

    if (chat.userId !== ctx.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Zugriff verweigert",
      });
    }

    const user = await db.users.findById(ctx.userId);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Benutzer nicht gefunden",
      });
    }

    const stats = await db.usageStats.get(ctx.userId);
    const isPremium = user.subscriptionTier === "premium";

    const maxMessages = isPremium ? Infinity : 20;
    if (stats.messagesToday >= maxMessages) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Tageslimit erreicht. Upgrade auf Premium für unbegrenzte Nachrichten.",
      });
    }

    const profile = await db.profiles.findById(chat.profileId);
    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Profil nicht gefunden",
      });
    }

    if (input.imageBase64) {
      const maxImages = isPremium ? 20 : 5;
      const profileImages = stats.imagesUploadedToday[profile.id] || 0;

      if (profileImages >= maxImages) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Tageslimit für Bilder erreicht (${maxImages} Bilder pro Tag).`,
        });
      }
      
      await db.usageStats.incrementImages(ctx.userId, profile.id);
    }

    const userMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      chatId: input.chatId,
      role: "user",
      content: input.message,
      imageUri: input.imageBase64,
      timestamp: Date.now(),
    };

    await db.messages.add(input.chatId, userMessage);

    const previousMessages = await db.messages.findByChatId(input.chatId);

    let systemPrompt = "Du bist ein freundlicher KI-Assistent für Kinder. ";
    
    if (input.languageLevel === "beginner") {
      systemPrompt += "Verwende einfache Wörter und kurze Sätze. Erkläre Dinge kindgerecht und geduldig.";
    } else if (input.languageLevel === "intermediate") {
      systemPrompt += "Verwende altersgerechte Sprache und erkläre Konzepte anschaulich.";
    } else {
      systemPrompt += "Verwende fortgeschrittene Sprache und gehe detailliert auf Themen ein.";
    }

    const messages: (UserMessage | AssistantMessage)[] = [
      { role: "user", content: systemPrompt },
    ];

    previousMessages
      .slice(-10)
      .forEach((msg) => {
        if (msg.role === "user") {
          if (msg.imageUri) {
            messages.push({
              role: "user",
              content: [
                { type: "text", text: msg.content },
                { type: "image", image: msg.imageUri },
              ],
            });
          } else {
            messages.push({
              role: "user",
              content: msg.content,
            });
          }
        } else {
          messages.push({
            role: "assistant",
            content: msg.content,
          });
        }
      });

    if (input.imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: input.message },
          { type: "image", image: input.imageBase64 },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: input.message,
      });
    }

    const assistantResponse = await generateText({ messages });

    const assistantMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      chatId: input.chatId,
      role: "assistant",
      content: assistantResponse,
      timestamp: Date.now(),
    };

    await db.messages.add(input.chatId, assistantMessage);

    if (previousMessages.length === 0 && input.message.length > 0) {
      await db.chats.update(input.chatId, {
        title: input.message.slice(0, 30),
      });
    }

    await db.usageStats.incrementMessages(ctx.userId);

    return {
      userMessage,
      assistantMessage,
      remainingMessages: isPremium
        ? Infinity
        : Math.max(0, maxMessages - stats.messagesToday - 1),
    };
  });

interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  imageUri?: string;
  timestamp: number;
}
