import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";

export default function DatenschutzScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Datenschutzbestimmungen</Text>
        <Text style={styles.paragraph}>
          Hier stehen die Datenschutzbestimmungen der App.
        </Text>
        <Text style={styles.paragraph}>
          Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst und halten
          uns an die geltenden Datenschutzgesetze.
        </Text>
        <Text style={styles.paragraph}>
          Diese Datenschutzerklärung informiert Sie darüber, wie wir mit Ihren
          Daten umgehen.
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
  paragraph: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
    marginBottom: 16,
  },
});
