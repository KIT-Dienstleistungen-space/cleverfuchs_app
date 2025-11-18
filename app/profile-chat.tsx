import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  Plus,
  MessageSquare,
  ImagePlus,
  Send,
  Trash2,
  Settings,
} from "lucide-react-native";
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";
import { useProfiles, Message } from "@/contexts/ProfileContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  buildChatRequest,
  chatClient,
  type ChatRequest,
} from "@/lib/api/chat";

export default function ProfileChatScreen() {
  const router = useRouter();
  const { id, chatId } = useLocalSearchParams<{ id: string; chatId?: string }>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const { profiles, getProfileChats, createChat, deleteChat, addMessage } =
    useProfiles();
  const {
    canSendMessage,
    canUploadImage,
    incrementMessageCount,
    incrementImageCount,
    getRemainingMessages,
    getRemainingImages,
    isPremium,
  } = useSubscription();

  const profile = profiles.find((p) => p.id === id);
  const profileChats = getProfileChats(id);

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showChatList, setShowChatList] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const chatMutation = useMutation({
    mutationFn: (payload: ChatRequest) => chatClient.sendMessage(payload),
  });

  useEffect(() => {
    if (chatId) {
      setCurrentChatId(chatId);
    } else if (profileChats.length > 0 && !currentChatId) {
      setCurrentChatId(profileChats[0].id);
    } else if (profileChats.length === 0) {
      const newChat = createChat(id);
      setCurrentChatId(newChat.id);
    }
  }, [chatId, profileChats.length, profileChats, currentChatId, createChat, id]);

  const currentChat = profileChats.find((c) => c.id === currentChatId);

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
    setCurrentChatId(newChat.id);
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
            const remainingChats = profileChats.filter((c) => c.id !== chatId);
            deleteChat(chatId);

            if (chatId === currentChatId) {
              if (remainingChats.length > 0) {
                setCurrentChatId(remainingChats[0].id);
              } else {
                const newChat = createChat(id);
                setCurrentChatId(newChat.id);
              }
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    if (!canUploadImage(id)) {
      const remaining = getRemainingImages(id);
      Alert.alert(
        "Bildlimit erreicht",
        `Du hast heute bereits alle Bilder hochgeladen. ${remaining} Bilder verbleiben. ${isPremium ? "" : "Upgrade zu Premium für mehr Bilder!"}`,
        [
          { text: "OK", style: "cancel" },
        ]
      );
      return;
    }

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Berechtigung erforderlich",
        "Bitte erlaube den Zugriff auf deine Fotos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      incrementImageCount(id);
    }
  };

  const sendMessage = () => {
    const trimmedMessage = inputText.trim();
    if ((!trimmedMessage && !selectedImage) || !currentChatId) return;

    if (chatMutation.isPending) {
      return;
    }

    if (!canSendMessage()) {
      const remaining = getRemainingMessages();
      Alert.alert(
        "Nachrichtenlimit erreicht",
        `Du hast heute bereits alle Nachrichten versendet. ${remaining === 0 ? "Keine" : remaining} Nachrichten verbleiben. ${isPremium ? "" : "Upgrade zu Premium für unbegrenzte Nachrichten!"}`,
        [
          { text: "OK", style: "cancel" },
        ]
      );
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedMessage,
      imageUri: selectedImage || undefined,
      timestamp: Date.now(),
    };

    const conversation = [...(currentChat?.messages ?? []), newMessage];

    addMessage(currentChatId, newMessage);
    incrementMessageCount();

    setInputText("");
    setSelectedImage(null);
    setChatError(null);
    scrollViewRef.current?.scrollToEnd({ animated: true });

    const payload = buildChatRequest(id, currentChatId, conversation);

    chatMutation.mutate(payload, {
      onSuccess: (response) => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.message.content,
          timestamp: Date.now(),
        };

        addMessage(currentChatId, assistantMessage);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      },
      onError: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler beim Senden.";
        setChatError(message);
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push(`/chats-overview?id=${id}` as any)}
        >
          <ChevronLeft size={28} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => setShowChatList(true)}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {profile.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {profile.name}
            </Text>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {currentChat?.title || "Chat"}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push(`/profile-settings?id=${id}` as any)}
          >
            <Settings size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCreateNewChat}
          >
            <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chatContainer}>
        {currentChat && currentChat.messages.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={80} color="#FFB84D" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Starte ein Gespräch</Text>
            <Text style={styles.emptySubtitle}>
              Schreibe eine Nachricht oder lade ein Bild hoch
            </Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {currentChat?.messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  message.role === "user"
                    ? styles.userMessageWrapper
                    : styles.assistantMessageWrapper,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    message.role === "user"
                      ? styles.userMessage
                      : styles.assistantMessage,
                  ]}
                >
                  {message.imageUri && (
                    <Image
                      source={{ uri: message.imageUri }}
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  )}
                  {message.content ? (
                    <Text
                      style={[
                        styles.messageText,
                        message.role === "user"
                          ? styles.userMessageText
                          : styles.assistantMessageText,
                      ]}
                    >
                      {message.content}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {chatMutation.isPending && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator color="#FF9500" size="small" />
            <Text style={styles.typingText}>Assistent schreibt ...</Text>
          </View>
        )}

        {chatError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{chatError}</Text>
            <TouchableOpacity
              style={styles.errorBannerButton}
              onPress={() => setChatError(null)}
            >
              <Text style={styles.errorBannerButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[styles.inputContainer, { paddingBottom: insets.bottom + 16 }]}
        >
          {selectedImage && (
            <View style={styles.selectedImageContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.selectedImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <ImagePlus size={24} color="#FF9500" strokeWidth={2} />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nachricht eingeben..."
              placeholderTextColor="#AAAAAA"
              multiline
              maxLength={2000}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                ((!inputText.trim() && !selectedImage) || chatMutation.isPending) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={
                (!inputText.trim() && !selectedImage) || chatMutation.isPending
              }
            >
              {chatMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Send size={22} color="#FFFFFF" strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        visible={showChatList}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChatList(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.chatListModal,
              {
                paddingTop: insets.top + 20,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chats von {profile.name}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowChatList(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.chatList}
              contentContainerStyle={styles.chatListContent}
              showsVerticalScrollIndicator={false}
            >
              {profileChats.map((chat) => (
                <View key={chat.id} style={styles.chatItemWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.chatItem,
                      chat.id === currentChatId && styles.chatItemActive,
                    ]}
                    onPress={() => {
                      setCurrentChatId(chat.id);
                      setShowChatList(false);
                    }}
                  >
                    <MessageSquare
                      size={24}
                      color={
                        chat.id === currentChatId ? "#FF9500" : "#666666"
                      }
                      strokeWidth={2}
                    />
                    <View style={styles.chatItemContent}>
                      <Text
                        style={[
                          styles.chatItemTitle,
                          chat.id === currentChatId &&
                            styles.chatItemTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {chat.title}
                      </Text>
                      <Text style={styles.chatItemSubtitle}>
                        {chat.messages.length} Nachrichten
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
            </ScrollView>

            <TouchableOpacity
              style={styles.newChatButton}
              onPress={() => {
                handleCreateNewChat();
                setShowChatList(false);
              }}
            >
              <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.newChatButtonText}>Neuer Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    paddingVertical: 12,
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  profileButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF9500",
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  chatTitle: {
    fontSize: 13,
    color: "#FFD9A3",
  },
  chatContainer: {
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    gap: 16,
  },
  messageWrapper: {
    width: "100%",
  },
  userMessageWrapper: {
    alignItems: "flex-end",
  },
  assistantMessageWrapper: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 20,
    padding: 16,
  },
  userMessage: {
    backgroundColor: "#FF9500",
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  assistantMessageText: {
    color: "#1A1A1A",
  },
  messageImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  selectedImageContainer: {
    position: "relative" as const,
    marginBottom: 12,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute" as const,
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    backgroundColor: "#FF3B30",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  removeImageText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  imageButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF5E6",
    borderRadius: 22,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: "#F8F8F8",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1A1A1A",
  },
  sendButton: {
    width: 44,
    height: 44,
    backgroundColor: "#FF9500",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  chatListModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "85%",
    paddingHorizontal: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 28,
    color: "#666666",
    fontWeight: "300",
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    gap: 12,
    paddingBottom: 24,
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
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    gap: 12,
  },
  chatItemActive: {
    backgroundColor: "#FFF5E6",
    borderWidth: 2,
    borderColor: "#FF9500",
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
  chatItemTitleActive: {
    color: "#FF9500",
  },
  chatItemSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  newChatButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
  },
  newChatButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  typingText: {
    fontSize: 14,
    color: "#666666",
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FFEFEF",
    borderWidth: 1,
    borderColor: "#FF3B30",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  errorBannerText: {
    flex: 1,
    color: "#B00020",
    fontSize: 14,
  },
  errorBannerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
  },
  errorBannerButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
