import { getDatabase } from "./database";

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

export interface Purchase {
  id: string;
  userId: string;
  productId: string;
  purchaseDate: number;
  expiryDate?: number;
  transactionId?: string;
  platform: string;
  status: string;
}

function generateAccessCode(): string {
  return Math.random().toString().slice(2, 10);
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export const db = {
  users: {
    create: async (email: string, password: string, name: string): Promise<User> => {
      const database = getDatabase();
      const id = generateId();
      const accessCode = generateAccessCode();
      const user: User = {
        id,
        email: email.toLowerCase(),
        password,
        name,
        subscriptionTier: "free",
        createdAt: Date.now(),
        accessCode,
      };

      await database.runAsync(
        "INSERT INTO users (id, email, password, name, subscriptionTier, createdAt, accessCode) VALUES (?, ?, ?, ?, ?, ?, ?)",
        id, email.toLowerCase(), password, name, "free", Date.now(), accessCode
      );

      return user;
    },

    findByEmail: async (email: string): Promise<User | undefined> => {
      const database = getDatabase();
      const result = await database.getFirstAsync<User>(
        "SELECT * FROM users WHERE email = ?",
        email.toLowerCase()
      );
      return result || undefined;
    },

    findById: async (id: string): Promise<User | undefined> => {
      const database = getDatabase();
      const result = await database.getFirstAsync<User>(
        "SELECT * FROM users WHERE id = ?",
        id
      );
      return result || undefined;
    },

    findByAccessCode: async (accessCode: string): Promise<User | undefined> => {
      const database = getDatabase();
      const result = await database.getFirstAsync<User>(
        "SELECT * FROM users WHERE accessCode = ?",
        accessCode
      );
      return result || undefined;
    },

    update: async (id: string, updates: Partial<User>): Promise<User | undefined> => {
      const database = getDatabase();
      const user = await db.users.findById(id);
      if (!user) return undefined;

      const updated = { ...user, ...updates };
      await database.runAsync(
        "UPDATE users SET email = ?, name = ?, subscriptionTier = ?, subscriptionExpiresAt = ? WHERE id = ?",
        updated.email, updated.name, updated.subscriptionTier, updated.subscriptionExpiresAt || null, id
      );

      return updated;
    },
  },

  profiles: {
    create: async (userId: string, name: string, birthYear: string): Promise<Profile> => {
      const database = getDatabase();
      const id = generateId();
      const now = Date.now();
      const profile: Profile = {
        id,
        userId,
        name,
        birthYear,
        languageLevel: "beginner",
        createdAt: now,
        updatedAt: now,
      };

      await database.runAsync(
        "INSERT INTO profiles (id, userId, name, birthYear, languageLevel, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        id, userId, name, birthYear, "beginner", now, now
      );

      return profile;
    },

    findByUserId: async (userId: string): Promise<Profile[]> => {
      const database = getDatabase();
      const results = await database.getAllAsync<Profile>(
        "SELECT * FROM profiles WHERE userId = ? ORDER BY createdAt DESC",
        userId
      );
      return results;
    },

    findById: async (id: string): Promise<Profile | undefined> => {
      const database = getDatabase();
      const result = await database.getFirstAsync<Profile>(
        "SELECT * FROM profiles WHERE id = ?",
        id
      );
      return result || undefined;
    },

    update: async (id: string, updates: Partial<Profile>): Promise<Profile | undefined> => {
      const database = getDatabase();
      const profile = await db.profiles.findById(id);
      if (!profile) return undefined;

      const updated = { ...profile, ...updates, updatedAt: Date.now() };
      await database.runAsync(
        "UPDATE profiles SET name = ?, birthYear = ?, languageLevel = ?, updatedAt = ? WHERE id = ?",
        updated.name, updated.birthYear, updated.languageLevel, updated.updatedAt, id
      );

      return updated;
    },

    delete: async (id: string): Promise<boolean> => {
      const database = getDatabase();
      await database.runAsync("DELETE FROM profiles WHERE id = ?", id);
      return true;
    },
  },

  chats: {
    create: async (userId: string, profileId: string): Promise<Chat> => {
      const database = getDatabase();
      const id = generateId();
      const now = Date.now();
      const chat: Chat = {
        id,
        profileId,
        userId,
        title: "Neuer Chat",
        createdAt: now,
        updatedAt: now,
      };

      await database.runAsync(
        "INSERT INTO chats (id, profileId, userId, title, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
        id, profileId, userId, "Neuer Chat", now, now
      );

      return chat;
    },

    findByProfileId: async (profileId: string): Promise<Chat[]> => {
      const database = getDatabase();
      const results = await database.getAllAsync<Chat>(
        "SELECT * FROM chats WHERE profileId = ? ORDER BY updatedAt DESC",
        profileId
      );
      return results;
    },

    findByUserId: async (userId: string): Promise<Chat[]> => {
      const database = getDatabase();
      const results = await database.getAllAsync<Chat>(
        "SELECT * FROM chats WHERE userId = ? ORDER BY updatedAt DESC",
        userId
      );
      return results;
    },

    findById: async (id: string): Promise<Chat | undefined> => {
      const database = getDatabase();
      const result = await database.getFirstAsync<Chat>(
        "SELECT * FROM chats WHERE id = ?",
        id
      );
      return result || undefined;
    },

    update: async (id: string, updates: Partial<Chat>): Promise<Chat | undefined> => {
      const database = getDatabase();
      const chat = await db.chats.findById(id);
      if (!chat) return undefined;

      const updated = { ...chat, ...updates, updatedAt: Date.now() };
      await database.runAsync(
        "UPDATE chats SET title = ?, updatedAt = ? WHERE id = ?",
        updated.title, updated.updatedAt, id
      );

      return updated;
    },

    delete: async (id: string): Promise<boolean> => {
      const database = getDatabase();
      await database.runAsync("DELETE FROM messages WHERE chatId = ?", id);
      await database.runAsync("DELETE FROM chats WHERE id = ?", id);
      return true;
    },
  },

  messages: {
    add: async (chatId: string, message: Message): Promise<void> => {
      const database = getDatabase();
      await database.runAsync(
        "INSERT INTO messages (id, chatId, role, content, imageUri, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
        message.id, chatId, message.role, message.content, message.imageUri || null, message.timestamp
      );

      await database.runAsync(
        "UPDATE chats SET updatedAt = ? WHERE id = ?",
        Date.now(), chatId
      );
    },

    findByChatId: async (chatId: string): Promise<Message[]> => {
      const database = getDatabase();
      const results = await database.getAllAsync<Message>(
        "SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC",
        chatId
      );
      return results;
    },

    deleteAllForChat: async (chatId: string): Promise<void> => {
      const database = getDatabase();
      await database.runAsync("DELETE FROM messages WHERE chatId = ?", chatId);
    },
  },

  usageStats: {
    get: async (userId: string): Promise<UsageStats> => {
      const database = getDatabase();
      const today = new Date().toDateString();

      const result = await database.getFirstAsync<{
        userId: string;
        messagesToday: number;
        lastResetDate: string;
      }>("SELECT * FROM usage_stats WHERE userId = ?", userId);

      if (!result || result.lastResetDate !== today) {
        const stats: UsageStats = {
          userId,
          messagesToday: 0,
          imagesUploadedToday: {},
          lastResetDate: today,
        };

        await database.runAsync(
          "INSERT OR REPLACE INTO usage_stats (userId, messagesToday, lastResetDate) VALUES (?, ?, ?)",
          userId, 0, today
        );

        return stats;
      }

      const imageResults = await database.getAllAsync<{
        profileId: string;
        count: number;
      }>("SELECT profileId, count FROM image_usage WHERE userId = ? AND date = ?", userId, today);

      const imagesUploadedToday: { [profileId: string]: number } = {};
      imageResults.forEach(row => {
        imagesUploadedToday[row.profileId] = row.count;
      });

      return {
        userId: result.userId,
        messagesToday: result.messagesToday,
        imagesUploadedToday,
        lastResetDate: result.lastResetDate,
      };
    },

    incrementMessages: async (userId: string): Promise<void> => {
      const database = getDatabase();
      const stats = await db.usageStats.get(userId);
      await database.runAsync(
        "UPDATE usage_stats SET messagesToday = ? WHERE userId = ?",
        stats.messagesToday + 1, userId
      );
    },

    incrementImages: async (userId: string, profileId: string): Promise<void> => {
      const database = getDatabase();
      const today = new Date().toDateString();
      
      await database.runAsync(
        "INSERT INTO image_usage (userId, profileId, date, count) VALUES (?, ?, ?, 1) ON CONFLICT(userId, profileId, date) DO UPDATE SET count = count + 1",
        userId, profileId, today
      );
    },
  },

  purchases: {
    create: async (purchase: Purchase): Promise<void> => {
      const database = getDatabase();
      await database.runAsync(
        "INSERT INTO purchases (id, userId, productId, purchaseDate, expiryDate, transactionId, platform, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        purchase.id, purchase.userId, purchase.productId, purchase.purchaseDate, 
        purchase.expiryDate || null, purchase.transactionId || null, purchase.platform, purchase.status
      );
    },

    findByUserId: async (userId: string): Promise<Purchase[]> => {
      const database = getDatabase();
      const results = await database.getAllAsync<Purchase>(
        "SELECT * FROM purchases WHERE userId = ? ORDER BY purchaseDate DESC",
        userId
      );
      return results;
    },

    findActivePurchase: async (userId: string, productId: string): Promise<Purchase | undefined> => {
      const database = getDatabase();
      const result = await database.getFirstAsync<Purchase>(
        "SELECT * FROM purchases WHERE userId = ? AND productId = ? AND status = 'active' AND (expiryDate IS NULL OR expiryDate > ?) ORDER BY purchaseDate DESC LIMIT 1",
        userId, productId, Date.now()
      );
      return result || undefined;
    },

    updateStatus: async (id: string, status: string): Promise<void> => {
      const database = getDatabase();
      await database.runAsync(
        "UPDATE purchases SET status = ? WHERE id = ?",
        status, id
      );
    },
  },
};
