import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  Plus,
  MessageSquare,
  Settings,
  Trash2,
} from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfiles } from "@/contexts/ProfileContext";

export default function ChatsOverviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { profiles, getProfileChats, createChat, deleteChat } = useProfiles();

  const profile = profiles.find((p) => p.id === id);
  const profileChats = getProfileChats(id);

  if (!profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profil nicht gefunden</Text>
        </View>
      </View>
    );
  }

  const handleCreateNewChat = () => {
    const newChat = createChat(id);
    router.push(`/profile-chat?id=${id}&chatId=${newChat.id}` as any);
  };

  const handleDeleteChat = (chatId: string) => {
    Alert.alert(
      "Chat löschen",
      "Möchtest du diesen Chat wirklich löschen?",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: () => {
            deleteChat(chatId);
          },
        },
      ]
    );
  };

  const handleChatPress = (chatId: string) => {
    router.push(`/profile-chat?id=${id}&chatId=${chatId}` as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/profiles")}
        >
          <ChevronLeft size={32} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {profile.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {profile.name}
            </Text>
            <Text style={styles.profileSubtitle}>
              {profileChats.length} {profileChats.length === 1 ? "Chat" : "Chats"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push(`/profile-settings?id=${id}` as any)}
        >
          <Settings size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {profileChats.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageSquare size={80} color="#FFB84D" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>Noch keine Chats</Text>
              <Text style={styles.emptySubtitle}>
                Erstelle einen neuen Chat mit {profile.name}
              </Text>
            </View>
          ) : (
            <View style={styles.chatList}>
              {profileChats.map((chat) => (
                <View key={chat.id} style={styles.chatItemWrapper}>
                  <TouchableOpacity
                    style={styles.chatItem}
                    onPress={() => handleChatPress(chat.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.chatIconContainer}>
                      <MessageSquare size={24} color="#FF9500" strokeWidth={2} />
                    </View>
                    <View style={styles.chatItemContent}>
                      <Text style={styles.chatItemTitle} numberOfLines={1}>
                        {chat.title}
                      </Text>
                      <Text style={styles.chatItemSubtitle}>
                        {chat.messages.length}{" "}
                        {chat.messages.length === 1 ? "Nachricht" : "Nachrichten"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteChat(chat.id)}
                  >
                    <Trash2 size={20} color="#FF3B30" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateNewChat}
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>Neuer Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF9500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FF9500",
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  profileSubtitle: {
    fontSize: 14,
    color: "#FFD9A3",
  },
  content: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  chatList: {
    gap: 12,
  },
  chatItemWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  chatIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#FFF5E6",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  chatItemContent: {
    flex: 1,
    gap: 4,
  },
  chatItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  chatItemSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  deleteButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: "#F5F5F5",
  },
  addButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#FF9500",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
