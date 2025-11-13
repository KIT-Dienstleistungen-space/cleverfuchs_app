import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback, useMemo } from "react";

export type LanguageLevel = "beginner" | "intermediate" | "advanced";

export interface Profile {
  id: string;
  name: string;
  birthYear: string;
  languageLevel: LanguageLevel;
  createdAt: number;
  updatedAt: number;
}

export interface Chat {
  id: string;
  profileId: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUri?: string;
  timestamp: number;
}

const PROFILES_KEY = "profiles";
const CHATS_KEY = "chats";

export const [ProfileProvider, useProfiles] = createContextHook(() => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const saveProfiles = useCallback(async () => {
    try {
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch (error) {
      console.error("Error saving profiles:", error);
    }
  }, [profiles]);

  const saveChats = useCallback(async () => {
    try {
      await AsyncStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error("Error saving chats:", error);
    }
  }, [chats]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profilesData, chatsData] = await Promise.all([
          AsyncStorage.getItem(PROFILES_KEY),
          AsyncStorage.getItem(CHATS_KEY),
        ]);

        if (profilesData) {
          setProfiles(JSON.parse(profilesData));
        }

        if (chatsData) {
          setChats(JSON.parse(chatsData));
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveProfiles();
    }
  }, [profiles, isLoading, saveProfiles]);

  useEffect(() => {
    if (!isLoading) {
      saveChats();
    }
  }, [chats, isLoading, saveChats]);

  const createProfile = useCallback((name: string, birthYear: string): Profile => {
    const newProfile: Profile = {
      id: Date.now().toString(),
      name,
      birthYear,
      languageLevel: "beginner",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setProfiles((prev) => [newProfile, ...prev]);
    return newProfile;
  }, []);

  const updateProfile = useCallback((profileId: string, updates: Partial<Profile>) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId
          ? { ...p, ...updates, updatedAt: Date.now() }
          : p
      )
    );
  }, []);

  const deleteProfile = useCallback((profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    setChats((prev) => prev.filter((c) => c.profileId !== profileId));
  }, []);

  const getProfileChats = useCallback((profileId: string): Chat[] => {
    return chats.filter((c) => c.profileId === profileId);
  }, [chats]);

  const createChat = useCallback((profileId: string): Chat => {
    const newChat: Chat = {
      id: Date.now().toString(),
      profileId,
      title: "Neuer Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setChats((prev) => [newChat, ...prev]);
    return newChat;
  }, []);

  const updateChat = useCallback((chatId: string, updates: Partial<Chat>) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, ...updates, updatedAt: Date.now() } : c
      )
    );
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
  }, []);

  const addMessage = useCallback((chatId: string, message: Message) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          const updatedMessages = [...c.messages, message];
          const updatedTitle =
            c.messages.length === 0 && message.content
              ? message.content.slice(0, 30)
              : c.title;

          return {
            ...c,
            messages: updatedMessages,
            title: updatedTitle,
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );
  }, []);

  return useMemo(() => ({
    profiles,
    chats,
    isLoading,
    createProfile,
    updateProfile,
    deleteProfile,
    getProfileChats,
    createChat,
    updateChat,
    deleteChat,
    addMessage,
  }), [
    profiles,
    chats,
    isLoading,
    createProfile,
    updateProfile,
    deleteProfile,
    getProfileChats,
    createChat,
    updateChat,
    deleteChat,
    addMessage,
  ]);
});
