import { useRouter } from "expo-router";
import { useProfiles } from "@/contexts/ProfileContext";
import { ChevronLeft, Calendar } from "lucide-react-native";
import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const router = useRouter();
  const { createProfile } = useProfiles();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear - i);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        scrollViewRef.current?.scrollTo({ y: 120, animated: true });
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleYearSelect = (year: number) => {
    setBirthYear(year.toString());
    setShowYearPicker(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? -insets.bottom : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={32} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Über dich</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[
                styles.input,
                nameFocused && styles.inputFocused,
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Name eingeben"
              placeholderTextColor="#CCCCCC"
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              returnKeyType="next"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Geburtsjahr</Text>
            <TouchableOpacity
              style={[styles.input, styles.dateInputWrapper]}
              onPress={() => {
                Keyboard.dismiss();
                setShowYearPicker(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.inputText, !birthYear && styles.placeholderText]}>
                {birthYear || "Jahr auswählen"}
              </Text>
              <View style={styles.calendarIcon}>
                <Calendar size={24} color="#FF9500" strokeWidth={2} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {!keyboardVisible && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!name || !birthYear) && styles.continueButtonDisabled,
            ]}
            disabled={!name || !birthYear}
            onPress={() => {
              console.log("Creating profile with:", { name, birthYear });
              createProfile(name, birthYear);
              router.replace("/profiles");
            }}
          >
            <Text style={styles.continueButtonText}>Weiter</Text>
          </TouchableOpacity>
        </View>
      )}

      {showYearPicker && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowYearPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setShowYearPicker(false)}
            />
            <View style={styles.yearPickerContainer}>
              <Text style={styles.yearPickerTitle}>Wähle ein Jahr</Text>
              
              <View style={styles.yearGrid}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearGridItem,
                      birthYear === year.toString() && styles.yearGridItemSelected,
                    ]}
                    onPress={() => handleYearSelect(year)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.yearGridText,
                        birthYear === year.toString() && styles.yearGridTextSelected,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={[
                  styles.weiterButton,
                  !birthYear && styles.weiterButtonDisabled,
                ]}
                disabled={!birthYear}
                onPress={() => setShowYearPicker(false)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.weiterButtonText,
                  !birthYear && styles.weiterButtonTextDisabled,
                ]}>Weiter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF9500",
  },
  header: {
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
  scrollView: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  scrollContent: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: "500",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#1A1A1A",
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputFocused: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FF9500",
    shadowColor: "#FF9500",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  inputText: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  placeholderText: {
    color: "#CCCCCC",
  },
  dateInputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  calendarIcon: {
    position: "absolute",
    right: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  continueButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF9500",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: "#CCCCCC",
    shadowOpacity: 0.1,
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackdrop: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  yearPickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  yearPickerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 32,
  },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  yearGridItem: {
    width: "30%",
    aspectRatio: 1.5,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  yearGridItemSelected: {
    backgroundColor: "#FF9500",
  },
  yearGridText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  yearGridTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  weiterButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  weiterButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  weiterButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  weiterButtonTextDisabled: {
    color: "#999999",
  },
});
