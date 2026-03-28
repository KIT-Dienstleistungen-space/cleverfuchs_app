import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";

export default function AGBScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Allgemeine Geschäftsbedingungen</Text>
        <Text style={styles.paragraph}>
          Hier stehen die Allgemeinen Geschäftsbedingungen (AGB) der App.
        </Text>
        <Text style={styles.paragraph}>
          Diese Bedingungen regeln die Nutzung unserer Dienste und legen die
          Rechte und Pflichten beider Parteien fest.
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
