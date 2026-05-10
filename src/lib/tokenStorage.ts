import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_TOKEN_KEY = "hivefive_auth_token";

export async function saveAuthToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    return;
  }
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  }
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function clearAuthToken(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    }
    return;
  }
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}
