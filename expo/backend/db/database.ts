import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync("kinderapp.db");

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      subscriptionTier TEXT DEFAULT 'free',
      subscriptionExpiresAt INTEGER,
      createdAt INTEGER NOT NULL,
      accessCode TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      birthYear TEXT NOT NULL,
      languageLevel TEXT DEFAULT 'beginner',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      profileId TEXT NOT NULL,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (profileId) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chatId TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      imageUri TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS usage_stats (
      userId TEXT PRIMARY KEY,
      messagesToday INTEGER DEFAULT 0,
      lastResetDate TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS image_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      profileId TEXT NOT NULL,
      date TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      UNIQUE(userId, profileId, date),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (profileId) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      productId TEXT NOT NULL,
      purchaseDate INTEGER NOT NULL,
      expiryDate INTEGER,
      transactionId TEXT,
      platform TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_profiles_userId ON profiles(userId);
    CREATE INDEX IF NOT EXISTS idx_chats_profileId ON chats(profileId);
    CREATE INDEX IF NOT EXISTS idx_chats_userId ON chats(userId);
    CREATE INDEX IF NOT EXISTS idx_messages_chatId ON messages(chatId);
    CREATE INDEX IF NOT EXISTS idx_image_usage_userId ON image_usage(userId);
    CREATE INDEX IF NOT EXISTS idx_purchases_userId ON purchases(userId);
  `);

  console.log("Database initialized successfully");
  return db;
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDatabase first.");
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
