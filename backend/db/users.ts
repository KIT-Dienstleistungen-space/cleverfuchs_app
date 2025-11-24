export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  subscriptionTier: "free" | "premium";
  subscriptionExpiresAt?: number;
  createdAt: number;
  accessCode: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  birthYear: string;
  languageLevel: "beginner" | "intermediate" | "advanced";
  createdAt: number;
  updatedAt: number;
}

export interface Chat {
  id: string;
  profileId: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  imageUri?: string;
  timestamp: number;
}

export interface UsageStats {
  userId: string;
  messagesToday: number;
  imagesUploadedToday: { [profileId: string]: number };
  lastResetDate: string;
}

const users = new Map<string, User>();
const profiles = new Map<string, Profile>();
const chats = new Map<string, Chat>();
const messages = new Map<string, Message[]>();
const usageStats = new Map<string, UsageStats>();

function generateAccessCode(): string {
  return Math.random().toString().slice(2, 10);
}

export const db = {
  users: {
    create: (email: string, password: string, name: string): User => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const user: User = {
        id,
        email: email.toLowerCase(),
        password,
        name,
        subscriptionTier: "free",
        createdAt: Date.now(),
        accessCode: generateAccessCode(),
      };
      users.set(id, user);
      return user;
    },

    findByEmail: (email: string): User | undefined => {
      return Array.from(users.values()).find(
        (u) => u.email === email.toLowerCase()
      );
    },

    findById: (id: string): User | undefined => {
      return users.get(id);
    },

    findByAccessCode: (accessCode: string): User | undefined => {
      return Array.from(users.values()).find(
        (u) => u.accessCode === accessCode
      );
    },

    update: (id: string, updates: Partial<User>): User | undefined => {
      const user = users.get(id);
      if (!user) return undefined;
      const updated = { ...user, ...updates };
      users.set(id, updated);
      return updated;
    },
  },

  profiles: {
    create: (userId: string, name: string, birthYear: string): Profile => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const profile: Profile = {
        id,
        userId,
        name,
        birthYear,
        languageLevel: "beginner",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      profiles.set(id, profile);
      return profile;
    },

    findByUserId: (userId: string): Profile[] => {
      return Array.from(profiles.values()).filter((p) => p.userId === userId);
    },

    findById: (id: string): Profile | undefined => {
      return profiles.get(id);
    },

    update: (id: string, updates: Partial<Profile>): Profile | undefined => {
      const profile = profiles.get(id);
      if (!profile) return undefined;
      const updated = { ...profile, ...updates, updatedAt: Date.now() };
      profiles.set(id, updated);
      return updated;
    },

    delete: (id: string): boolean => {
      return profiles.delete(id);
    },
  },

  chats: {
    create: (userId: string, profileId: string): Chat => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const chat: Chat = {
        id,
        profileId,
        userId,
        title: "Neuer Chat",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      chats.set(id, chat);
      messages.set(id, []);
      return chat;
    },

    findByProfileId: (profileId: string): Chat[] => {
      return Array.from(chats.values()).filter((c) => c.profileId === profileId);
    },

    findById: (id: string): Chat | undefined => {
      return chats.get(id);
    },

    update: (id: string, updates: Partial<Chat>): Chat | undefined => {
      const chat = chats.get(id);
      if (!chat) return undefined;
      const updated = { ...chat, ...updates, updatedAt: Date.now() };
      chats.set(id, updated);
      return updated;
    },

    delete: (id: string): boolean => {
      messages.delete(id);
      return chats.delete(id);
    },
  },

  messages: {
    add: (chatId: string, message: Message): void => {
      const chatMessages = messages.get(chatId) || [];
      chatMessages.push(message);
      messages.set(chatId, chatMessages);
    },

    findByChatId: (chatId: string): Message[] => {
      return messages.get(chatId) || [];
    },

    deleteAllForChat: (chatId: string): void => {
      messages.delete(chatId);
    },
  },

  usageStats: {
    get: (userId: string): UsageStats => {
      const today = new Date().toDateString();
      let stats = usageStats.get(userId);

      if (!stats || stats.lastResetDate !== today) {
        stats = {
          userId,
          messagesToday: 0,
          imagesUploadedToday: {},
          lastResetDate: today,
        };
        usageStats.set(userId, stats);
      }

      return stats;
    },

    incrementMessages: (userId: string): void => {
      const stats = db.usageStats.get(userId);
      stats.messagesToday += 1;
      usageStats.set(userId, stats);
    },

    incrementImages: (userId: string, profileId: string): void => {
      const stats = db.usageStats.get(userId);
      stats.imagesUploadedToday[profileId] =
        (stats.imagesUploadedToday[profileId] || 0) + 1;
      usageStats.set(userId, stats);
    },
  },
};
