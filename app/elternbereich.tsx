import { useRouter } from "expo-router";
import { ChevronLeft, QrCode, LogIn } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  PanResponder,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ElternbereichScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [code, setCode] = useState<string[]>(["", "", "", "", "", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const translateX = useRef(new Animated.Value(0)).current;


  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SCREEN_WIDTH * 0.3) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            router.back();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text[text.length - 1];
    }

    const newCode = [...code];
    newCode[index] = text;
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



  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={32} color="#1A1A1A" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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

          <Text style={styles.title}>
            {user ? `Hallo, ${user.name}!` : "Schön, dass Du da bist!"}
          </Text>

          {!user && (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push("/login")}
            >
              <LogIn size={20} color="#FF9500" strokeWidth={2} />
              <Text style={styles.loginButtonText}>Als Elternteil anmelden</Text>
            </TouchableOpacity>
          )}

          {user && (
            <View style={styles.accessCodeCard}>
              <Text style={styles.accessCodeLabel}>Dein Zugangscode für Kinder:</Text>
              <Text style={styles.accessCode}>{user.accessCode}</Text>
              <Text style={styles.accessCodeHint}>
                Gib diesen Code ein, um mit dem Kinderbereich zu verbinden
              </Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>QR-Code scannen</Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => router.push("/scanner")}
            >
              <QrCode size={24} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.scanButtonText}>Jetzt scannen</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>oder</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.sectionTitle}>Code eingeben</Text>
            <View style={styles.codeInputContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={styles.codeInput}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  testID={`code-input-${index}`}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.impressumButton}
            onPress={() => router.push("/impressum")}
          >
            <Text style={styles.impressumText}>Impressum</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoBackground: {
    width: 140,
    height: 140,
    borderRadius: 32,
    backgroundColor: "#FF9500",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginBottom: 40,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#1A1A1A",
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 18,
    paddingHorizontal: 32,
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
  scanButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  divider: {
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
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  codeInput: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FF9500",
    fontSize: 24,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    textAlign: "center",
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
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#FF9500",
  },
  accessCodeCard: {
    width: "100%",
    backgroundColor: "#FFF5E6",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#FF9500",
  },
  accessCodeLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  accessCode: {
    fontSize: 32,
    fontWeight: "600" as const,
    color: "#FF9500",
    textAlign: "center",
    letterSpacing: 4,
    marginBottom: 8,
  },
  accessCodeHint: {
    fontSize: 12,
    color: "#999999",
    textAlign: "center",
  },
});
