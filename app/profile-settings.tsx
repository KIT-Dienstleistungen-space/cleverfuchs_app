import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Trash2, Crown, MessageSquare, Image as ImageIcon, Users } from "lucide-react-native";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfiles, LanguageLevel } from "@/contexts/ProfileContext";
import { useSubscription } from "@/contexts/SubscriptionContext";

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { profiles, updateProfile, deleteProfile } = useProfiles();
  const {
    isPremium,
    limits,
    getRemainingMessages,
    getRemainingImages,
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

  const profile = profiles.find((p) => p.id === id);

  const [name, setName] = useState(profile?.name || "");
  const [birthYear, setBirthYear] = useState(profile?.birthYear || "");
  const [languageLevel, setLanguageLevel] = useState<LanguageLevel>(
    profile?.languageLevel || "beginner"
  );

  if (!profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profil nicht gefunden</Text>
        </View>
      </View>
    );
  }

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Fehler", "Bitte gib einen Namen ein");
      return;
    }

    updateProfile(id, {
      name: name.trim(),
      birthYear,
      languageLevel,
    });

    Alert.alert("Gespeichert", "Die Änderungen wurden gespeichert", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      "Profil löschen",
      `Möchtest du das Profil von ${profile.name} wirklich löschen? Alle Chats werden ebenfalls gelöscht.`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: () => {
            deleteProfile(id);
            router.replace("/profiles");
          },
        },
      ]
    );
  };

  const languageLevels: { value: LanguageLevel; label: string }[] = [
    { value: "beginner", label: "Anfänger" },
    { value: "intermediate", label: "Fortgeschritten" },
    { value: "advanced", label: "Experte" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={32} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil bearbeiten</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {name.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Name eingeben"
              placeholderTextColor="#CCCCCC"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Geburtsjahr</Text>
            <TextInput
              style={styles.input}
              value={birthYear}
              onChangeText={setBirthYear}
              placeholder="Jahr eingeben"
              placeholderTextColor="#CCCCCC"
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Sprachniveau</Text>
            <View style={styles.languageLevelContainer}>
              {languageLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.levelButton,
                    languageLevel === level.value && styles.levelButtonActive,
                  ]}
                  onPress={() => setLanguageLevel(level.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.levelButtonText,
                      languageLevel === level.value &&
                        styles.levelButtonTextActive,
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Änderungen speichern</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.subscriptionHeader}>
            <Text style={styles.subscriptionTitle}>
              {isPremium ? "Premium Mitglied" : "Kostenlose Version"}
            </Text>
            {isPremium && <Crown size={24} color="#FFD700" strokeWidth={2} />}
          </View>

          <View style={styles.subscriptionStatusRow}>
            <Text style={styles.subscriptionStatusLabel}>Status</Text>
            <View style={styles.subscriptionStatusBadge}>
              <Text style={styles.subscriptionStatusText}>{statusText}</Text>
            </View>
          </View>

          <View style={styles.limitsContainer}>
            <View style={styles.limitItem}>
              <View style={styles.limitIconContainer}>
                <MessageSquare size={20} color="#FF9500" strokeWidth={2} />
              </View>
              <View style={styles.limitContent}>
                <Text style={styles.limitLabel}>Nachrichten heute</Text>
                <Text style={styles.limitValue}>
                  {isPremium
                    ? "Unbegrenzt"
                    : `${getRemainingMessages()} von ${limits.maxMessagesPerDay}`}
                </Text>
              </View>
            </View>

            <View style={styles.limitItem}>
              <View style={styles.limitIconContainer}>
                <ImageIcon size={20} color="#FF9500" strokeWidth={2} />
              </View>
              <View style={styles.limitContent}>
                <Text style={styles.limitLabel}>Bilder heute</Text>
                <Text style={styles.limitValue}>
                  {getRemainingImages(id)} von {limits.maxImagesPerProfilePerDay}
                </Text>
              </View>
            </View>

            <View style={styles.limitItem}>
              <View style={styles.limitIconContainer}>
                <Users size={20} color="#FF9500" strokeWidth={2} />
              </View>
              <View style={styles.limitContent}>
                <Text style={styles.limitLabel}>Profile</Text>
                <Text style={styles.limitValue}>
                  {profiles.length} von {limits.maxProfiles}
                </Text>
              </View>
            </View>
          </View>

          {!isPremium && (
            <TouchableOpacity
              style={[styles.upgradeButton, isPurchaseBusy && styles.upgradeButtonDisabled]}
              onPress={showPremiumBenefits}
              disabled={isPurchaseBusy}
            >
              <Crown size={20} color="#FFD700" strokeWidth={2} />
              <Text style={styles.upgradeButtonText}>
                {isPurchaseBusy ? "Kauf läuft..." : "Auf Premium upgraden"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.restoreButton, isRestoreBusy && styles.restoreButtonDisabled]}
            onPress={startRestoreFlow}
            disabled={isRestoreBusy}
          >
            <Text style={styles.restoreButtonText}>
              {isRestoreBusy ? "Wird geprüft..." : "Kauf wiederherstellen"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color="#FF3B30" strokeWidth={2} />
          <Text style={styles.deleteButtonText}>Profil löschen</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    paddingTop: 32,
    paddingHorizontal: 24,
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FF9500",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 44,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#1A1A1A",
    borderWidth: 2,
    borderColor: "transparent",
  },
  languageLevelContainer: {
    gap: 12,
  },
  levelButton: {
    backgroundColor: "#F8F8F8",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  levelButtonActive: {
    backgroundColor: "#FFF5E6",
    borderColor: "#FF9500",
  },
  levelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666666",
  },
  levelButtonTextActive: {
    color: "#FF9500",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#FF9500",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF3B30",
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  subscriptionStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  subscriptionStatusLabel: {
    fontSize: 14,
    color: "#666666",
  },
  subscriptionStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#FFF5E6",
  },
  subscriptionStatusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF9500",
  },
  limitsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  limitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  limitIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#FFF5E6",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  limitContent: {
    flex: 1,
  },
  limitLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  limitValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  upgradeButton: {
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  restoreButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF9500",
    alignItems: "center",
  },
  restoreButtonDisabled: {
    opacity: 0.6,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF9500",
  },
});
