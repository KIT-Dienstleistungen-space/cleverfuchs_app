import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Stack } from "expo-router";
import { ScanLine, Calendar } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function KinderbereichScreen() {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const insets = useSafeAreaInsets();

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text[text.length - 1];
    }

    const newCode = [...code];
    newCode[index] = text.toUpperCase();
    setCode(newCode);

    if (text && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleScanPress = () => {
    console.log("Scanner öffnen");
  };

  const handleCalendarPress = () => {
    console.log("Kalender öffnen");
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: Math.max(insets.top, 20) + 60 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
          <View style={styles.iconContainer}>
            <View style={styles.iconWrapper}>
              <View style={styles.iconInner}>
                <View style={styles.cloverLeaf}>
                  <View style={styles.cloverPetal} />
                  <View style={[styles.cloverPetal, styles.cloverPetalRotated]} />
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.title}>Schön, dass Du da bist!</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QR-Code scannen</Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScanPress}
              activeOpacity={0.8}
            >
              <ScanLine size={24} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.scanButtonText}>Jetzt scannen</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>oder</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Code eingeben</Text>
            <View style={styles.codeInputContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputFilled : null,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="default"
                  maxLength={1}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  selectTextOnFocus
                  testID={`code-input-${index}`}
                />
              ))}
            </View>
          </View>

          <View style={styles.calendarSection}>
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={handleCalendarPress}
              activeOpacity={0.7}
            >
              <Calendar size={20} color="#4285F4" strokeWidth={2} />
              <Text style={styles.calendarButtonText}>Kalender</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4285F4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconInner: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  cloverLeaf: {
    width: 60,
    height: 60,
    position: "relative",
  },
  cloverPetal: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    top: 0,
    left: 0,
  },
  cloverPetalRotated: {
    transform: [{ rotate: "90deg" }],
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 48,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: "#4285F4",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#4285F4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    fontSize: 14,
    color: "#999999",
    marginHorizontal: 16,
    fontWeight: "500" as const,
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  codeInput: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: "#4285F4",
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#1A1A1A",
    textAlign: "center",
    backgroundColor: "#FFFFFF",
  },
  codeInputFilled: {
    backgroundColor: "#F0F7FF",
    borderColor: "#4285F4",
  },
  calendarSection: {
    marginTop: 24,
    alignItems: "center",
  },
  calendarButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#F0F7FF",
  },
  calendarButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#4285F4",
  },
  bottomSpacer: {
    height: 40,
  },
});
