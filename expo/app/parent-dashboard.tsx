import { useRouter } from "expo-router";
import { ChevronLeft, Users, MessageSquare, Image as ImageIcon, Calendar } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";

export default function ParentDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const statisticsQuery = trpc.parent.statistics.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const allChatsQuery = trpc.parent.allChats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const handleRefresh = async () => {
    await Promise.all([statisticsQuery.refetch(), allChatsQuery.refetch()]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={32} color="#1A1A1A" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Bitte melden Sie sich an, um die Statistiken zu sehen
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginButtonText}>Zur Anmeldung</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={32} color="#1A1A1A" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Übersicht</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={statisticsQuery.isLoading || allChatsQuery.isLoading}
            onRefresh={handleRefresh}
            tintColor="#FF9500"
          />
        }
      >
        {statisticsQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9500" />
          </View>
        ) : statisticsQuery.data ? (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Users size={24} color="#FF9500" strokeWidth={2} />
                </View>
                <Text style={styles.statValue}>{statisticsQuery.data.totalProfiles}</Text>
                <Text style={styles.statLabel}>Profile</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <MessageSquare size={24} color="#4CAF50" strokeWidth={2} />
                </View>
                <Text style={styles.statValue}>{statisticsQuery.data.totalChats}</Text>
                <Text style={styles.statLabel}>Chats</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Calendar size={24} color="#2196F3" strokeWidth={2} />
                </View>
                <Text style={styles.statValue}>{statisticsQuery.data.messagesToday}</Text>
                <Text style={styles.statLabel}>Nachrichten heute</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile Statistiken</Text>
              {statisticsQuery.data.profileStats.map((profile) => (
                <View key={profile.profileId} style={styles.profileCard}>
                  <View style={styles.profileHeader}>
                    <Text style={styles.profileName}>{profile.profileName}</Text>
                  </View>
                  <View style={styles.profileStats}>
                    <View style={styles.profileStat}>
                      <MessageSquare size={16} color="#666" strokeWidth={2} />
                      <Text style={styles.profileStatText}>{profile.chatCount} Chats</Text>
                    </View>
                    <View style={styles.profileStat}>
                      <Calendar size={16} color="#666" strokeWidth={2} />
                      <Text style={styles.profileStatText}>
                        {profile.messageCount} Nachrichten
                      </Text>
                    </View>
                    <View style={styles.profileStat}>
                      <ImageIcon size={16} color="#666" strokeWidth={2} />
                      <Text style={styles.profileStatText}>
                        {profile.imagesUploadedToday} Bilder heute
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chat Verlauf</Text>
              {allChatsQuery.data?.map((chat) => (
                <TouchableOpacity
                  key={chat.id}
                  style={styles.chatCard}
                  onPress={() => router.push(`/profile-chat?chatId=${chat.id}`)}
                >
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatTitle}>{chat.title}</Text>
                    <Text style={styles.chatProfile}>{chat.profileName}</Text>
                  </View>
                  <View style={styles.chatDetails}>
                    <Text style={styles.chatMessageCount}>
                      {chat.messageCount} Nachrichten
                    </Text>
                    {chat.lastMessage && (
                      <Text style={styles.chatLastMessage} numberOfLines={1}>
                        {chat.lastMessage.content}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Keine Daten verfügbar</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#1A1A1A",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#1A1A1A",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    marginBottom: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1A1A1A",
  },
  profileStats: {
    flexDirection: "column",
    gap: 8,
  },
  profileStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileStatText: {
    fontSize: 14,
    color: "#666666",
  },
  chatCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chatHeader: {
    marginBottom: 8,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginBottom: 4,
  },
  chatProfile: {
    fontSize: 14,
    color: "#FF9500",
  },
  chatDetails: {
    gap: 4,
  },
  chatMessageCount: {
    fontSize: 12,
    color: "#999999",
  },
  chatLastMessage: {
    fontSize: 14,
    color: "#666666",
  },
});
