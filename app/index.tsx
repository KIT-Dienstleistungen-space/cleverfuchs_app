import { useRouter } from "expo-router";
import { QrCode } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Image
              source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/3bblp1qx0ryjk7j7559yq" }}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
        </View>

        <Text style={styles.title}>Schön, dass Du da bist!</Text>

        <View style={styles.linksContainer}>
          <Text style={styles.beforeText}>Bevor es losgeht, lies dir gerne unsere </Text>
          <TouchableOpacity onPress={() => router.push("/agb")}>
            <Text style={styles.link}>AGB</Text>
          </TouchableOpacity>
          <Text style={styles.beforeText}> und </Text>
          <TouchableOpacity onPress={() => router.push("/datenschutz")}>
            <Text style={styles.link}>Datenschutzbestimmungen</Text>
          </TouchableOpacity>
          <Text style={styles.beforeText}> durch.</Text>
        </View>

        <View style={styles.sectionsContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zum Kinderbereich</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/profiles")}
            >
              <Text style={styles.primaryButtonText}>Kostenlos starten</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bereich für Codes & QR-Codes</Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/elternbereich")}
            >
              <QrCode size={24} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.secondaryButtonText}>Jetzt scannen</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.impressumButton}
          onPress={() => router.push("/impressum")}
        >
          <Text style={styles.impressumText}>Impressum</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoBackground: {
    width: 140,
    height: 140,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 40,
    textAlign: "center",
  },
  linksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  beforeText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  link: {
    fontSize: 14,
    color: "#FF9500",
    textDecorationLine: "underline",
  },
  sectionsContainer: {
    width: "100%",
    gap: 32,
  },
  section: {
    width: "100%",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  primaryButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF9500",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#FF9500",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  impressumButton: {
    marginTop: 40,
    paddingVertical: 8,
  },
  impressumText: {
    fontSize: 14,
    color: "#999999",
    textDecorationLine: "underline",
  },
});
