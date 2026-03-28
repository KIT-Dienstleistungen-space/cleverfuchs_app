import { useRouter } from "expo-router";
import { ChevronLeft, Mail, Lock, User } from "lucide-react-native";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert("Fehler", "Bitte fülle alle Felder aus");
      return;
    }

    setIsLoading(true);

    try {
      const result = isLogin
        ? await login(email, password)
        : await register(email, password, name);

      if (result.success) {
        router.replace("/profiles" as any);
      } else {
        Alert.alert("Fehler", result.error || "Ein Fehler ist aufgetreten");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={32} color="#1A1A1A" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          {isLogin ? "Willkommen zurück!" : "Konto erstellen"}
        </Text>
        <Text style={styles.subtitle}>
          {isLogin
            ? "Melde dich an, um fortzufahren"
            : "Erstelle ein Konto für den Elternbereich"}
        </Text>

        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <User size={20} color="#666666" strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor="#999999"
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Mail size={20} color="#666666" strokeWidth={2} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="E-Mail"
              placeholderTextColor="#999999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#666666" strokeWidth={2} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Passwort"
              placeholderTextColor="#999999"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isLogin ? "Anmelden" : "Registrieren"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchButtonText}>
              {isLogin
                ? "Noch kein Konto? Registrieren"
                : "Bereits ein Konto? Anmelden"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 40,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A1A",
  },
  submitButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#FF9500",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  switchButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  switchButtonText: {
    fontSize: 14,
    color: "#FF9500",
    fontWeight: "500" as const,
  },
});
