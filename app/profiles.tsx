import { useRouter } from "expo-router";
import { Plus, Settings, ChevronLeft, Crown, Lock } from "lucide-react-native";
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
import { useSubscription } from "@/contexts/SubscriptionContext";

export default function ProfilesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profiles, isLoading } = useProfiles();
  const {
    isPremium,
    limits,
    canCreateProfile,
    purchaseSubscription,
    restoreSubscription,
    subscription,
    iapState,
  } = useSubscription();

  const statusLabels: Record<string, string> = {
    inactive: "Kein aktives Abo",
    pending: "Kauf wird geprüft",
    active: "Premium aktiv",
    restored: "Premium wiederhergestellt",
    failed: "Letzter Kauf fehlgeschlagen",
    expired: "Abo abgelaufen",
    canceled: "Abo beendet",
  };

  const statusText = iapState.lastError
    ? `Fehler: ${iapState.lastError}`
    : iapState.lastMessage || statusLabels[subscription.status] || "Status unbekannt";
  const isPurchaseBusy =
    iapState.purchase === "pending" || iapState.verification === "pending";
  const isRestoreBusy = iapState.restore === "pending";

  const startPurchaseFlow = () => {
    purchaseSubscription().catch((error) => {
      Alert.alert(
        "Kauf fehlgeschlagen",
        error instanceof Error ? error.message : "Unbekannter Fehler"
      );
    });
  };

  const startRestoreFlow = () => {
    restoreSubscription().catch((error) => {
      Alert.alert(
        "Wiederherstellung fehlgeschlagen",
        error instanceof Error ? error.message : "Unbekannter Fehler"
      );
    });
  };

  const showPremiumBenefits = () => {
    Alert.alert(
      "Premium für 4,99€/Monat",
      "Vorteile:\n• Bis zu 10 Profile\n• Unbegrenzte Nachrichten\n• 20 Bilder pro Profil täglich",
      [
        { text: "Abbrechen", style: "cancel" },
        { text: "Jetzt kaufen", onPress: startPurchaseFlow },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Lädt...</Text>
        </View>
      </View>
    );
  }

  const handleAddProfile = () => {
    if (!canCreateProfile(profiles.length)) {
      Alert.alert(
        "Premium erforderlich",
        `Du kannst in der kostenlosen Version nur ${limits.maxProfiles} Profil erstellen. Upgrade zu Premium für bis zu ${limits.maxProfiles === 1 ? "10 Profile" : "mehr Profile"}.`,
        [
          { text: "Abbrechen", style: "cancel" },
          {
            text: "Premium kaufen",
            onPress: showPremiumBenefits,
          },
        ]
      );
      return;
    }
    router.push("/onboarding");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={32} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kinderprofile</Text>
        {isPremium ? (
          <View style={styles.premiumBadge}>
            <Crown size={20} color="#FFD700" strokeWidth={2} />
          </View>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>

      <View style={styles.content}>
        {!isPremium && (
          <View style={styles.premiumBanner}>
            <View style={styles.premiumBannerHeader}>
              <Crown size={24} color="#FFD700" strokeWidth={2} />
              <View style={styles.premiumBannerContent}>
                <Text style={styles.premiumBannerTitle}>Upgrade zu Premium</Text>
                <Text style={styles.premiumBannerSubtitle}>
                  Nur 4,99€/Monat für unbegrenzte Möglichkeiten
                </Text>
                <Text style={styles.premiumBannerStatus}>{statusText}</Text>
              </View>
            </View>
            <View style={styles.premiumBannerActions}>
              <TouchableOpacity
                style={[
                  styles.premiumBannerButton,
                  (isPurchaseBusy || isRestoreBusy) && styles.premiumBannerButtonDisabled,
                ]}
                disabled={isPurchaseBusy || isRestoreBusy}
                onPress={showPremiumBenefits}
              >
                <Text style={styles.premiumBannerButtonText}>
                  {isPurchaseBusy ? "Wird geprüft..." : "Premium kaufen"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.premiumBannerSecondaryButton}
                onPress={startRestoreFlow}
                disabled={isRestoreBusy}
              >
                <Text style={styles.premiumBannerSecondaryText}>
                  {isRestoreBusy ? "Lädt..." : "Wiederherstellen"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {profiles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Noch keine Profile</Text>
              <Text style={styles.emptySubtitle}>
                Erstelle ein neues Kinderprofil
              </Text>
            </View>
          ) : (
            <View style={styles.profilesGrid}>
              {profiles.map((profile) => (
                <View key={profile.id} style={styles.profileCard}>
                  <TouchableOpacity
                    style={styles.profileCardMain}
                    onPress={() => router.push(`/chats-overview?id=${profile.id}` as any)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.profileAvatar}>
                      <Text style={styles.profileAvatarText}>
                        {profile.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {profile.name}
                    </Text>
                    <Text style={styles.profileYear}>{profile.birthYear}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.profileSettings}
                    onPress={() =>
                      router.push(`/profile-settings?id=${profile.id}` as any)
                    }
                    activeOpacity={0.7}
                  >
                    <Settings size={20} color="#666666" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={[
              styles.addButton,
              !canCreateProfile(profiles.length) && styles.addButtonLocked,
            ]}
            onPress={handleAddProfile}
          >
            {!canCreateProfile(profiles.length) ? (
              <Lock size={24} color="#FFFFFF" strokeWidth={2.5} />
            ) : (
              <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
            )}
            <Text style={styles.addButtonText}>
              {!canCreateProfile(profiles.length)
                ? "Premium für mehr Profile"
                : "Neues Profil erstellen"}
            </Text>
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
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
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
    gap: 12,
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
  profilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  profileCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  profileCardMain: {
    alignItems: "center",
    gap: 12,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF9500",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  profileAvatarText: {
    fontSize: 36,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
  },
  profileYear: {
    fontSize: 14,
    color: "#666666",
  },
  profileSettings: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    alignItems: "center",
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
  addButtonLocked: {
    backgroundColor: "#666666",
  },
  premiumBadge: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumBanner: {
    backgroundColor: "#1A1A1A",
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  premiumBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumBannerContent: {
    flex: 1,
    gap: 4,
  },
  premiumBannerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  premiumBannerSubtitle: {
    fontSize: 13,
    color: "#AAAAAA",
  },
  premiumBannerStatus: {
    fontSize: 12,
    color: "#D1D1D6",
  },
  premiumBannerActions: {
    flexDirection: "row",
    gap: 12,
  },
  premiumBannerButton: {
    flex: 1,
    backgroundColor: "#FFD700",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  premiumBannerButtonDisabled: {
    opacity: 0.6,
  },
  premiumBannerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  premiumBannerSecondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  premiumBannerSecondaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFD700",
  },
});
