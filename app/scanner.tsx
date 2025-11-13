import React from "react";
import { StyleSheet, Text, View, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <Image
            source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/3bblp1qx0ryjk7j7559yq" }}
            style={styles.logo}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.title}>QR-Code Scanner</Text>
        <Text style={styles.description}>
          Scanne QR-Codes und Codes, um auf exklusive Inhalte zuzugreifen.
        </Text>
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
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 24,
    width: 120,
    height: 120,
    backgroundColor: "#FF9500",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
    textAlign: "center",
  },
});
