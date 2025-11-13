import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";

export default function ImpressumScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Impressum</Text>
        <Text style={styles.paragraph}>
          Hier stehen die Impressumsinformationen der App.
        </Text>
        <Text style={styles.sectionTitle}>Angaben gemäß § 5 TMG:</Text>
        <Text style={styles.paragraph}>
          Firmenname{"\n"}
          Straße und Hausnummer{"\n"}
          PLZ und Ort{"\n"}
          Land
        </Text>
        <Text style={styles.sectionTitle}>Kontakt:</Text>
        <Text style={styles.paragraph}>
          Telefon: +49 (0) 123 456789{"\n"}
          E-Mail: info@example.com
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
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 16,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
    marginBottom: 16,
  },
});
