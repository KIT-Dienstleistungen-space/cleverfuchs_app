import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback, useMemo } from "react";
import { trpcClient } from "@/lib/trpc";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  accessCode: string;
  subscriptionTier: "free" | "premium";
  subscriptionExpiresAt?: number;
}

const AUTH_KEY = "auth_user";
const TOKEN_KEY = "auth_token";

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveAuth = useCallback(async (authUser: AuthUser, authToken: string) => {
    try {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
      await AsyncStorage.setItem(TOKEN_KEY, authToken);
      setUser(authUser);
      setToken(authToken);
    } catch (error) {
      console.error("Error saving auth:", error);
    }
  }, []);

  const clearAuth = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
      await AsyncStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error("Error clearing auth:", error);
    }
  }, []);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem(AUTH_KEY),
          AsyncStorage.getItem(TOKEN_KEY),
        ]);

        if (storedUser && storedToken) {
          const parsedUser: AuthUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
        }
      } catch (error) {
        console.error("Error loading auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const loginMutation = await trpcClient.auth.login.mutate({ email, password });
        await saveAuth(loginMutation, loginMutation.id);
        return { success: true };
      } catch (error: any) {
        console.error("Login error:", error);
        return { success: false, error: error.message || "Login fehlgeschlagen" };
      }
    },
    [saveAuth]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const registerMutation = await trpcClient.auth.register.mutate({
          email,
          password,
          name,
        });
        await saveAuth(registerMutation, registerMutation.id);
        return { success: true };
      } catch (error: any) {
        console.error("Register error:", error);
        return {
          success: false,
          error: error.message || "Registrierung fehlgeschlagen",
        };
      }
    },
    [saveAuth]
  );

  const logout = useCallback(async () => {
    await clearAuth();
  }, [clearAuth]);

  return useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }),
    [user, token, isLoading, login, register, logout]
  );
});
