import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { trpc, trpcReactClient } from "@/lib/trpc";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="elternbereich" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="kinderbereich" options={{ headerShown: true, title: "Kinderbereich" }} />
      <Stack.Screen name="scanner" options={{ headerShown: true, title: "QR-Code Scanner" }} />
      <Stack.Screen name="agb" options={{ headerShown: true, title: "AGB" }} />
      <Stack.Screen name="datenschutz" options={{ headerShown: true, title: "Datenschutz" }} />
      <Stack.Screen name="impressum" options={{ headerShown: true, title: "Impressum" }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="profiles" options={{ headerShown: false }} />
      <Stack.Screen name="profile-settings" options={{ headerShown: false }} />
      <Stack.Screen name="profile-chat" options={{ headerShown: false }} />
      <Stack.Screen name="chats-overview" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcReactClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SubscriptionProvider>
            <ProfileProvider>
              <GestureHandlerRootView>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </ProfileProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
