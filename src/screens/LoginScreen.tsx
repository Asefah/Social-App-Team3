import { useFocusEffect, useRouter } from "expo-router";
import * as Device from "expo-device";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { ApiError, getApiBaseUrl } from "@/lib/api";
import { navigateToAppHome } from "@/lib/navigateAfterAuth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const localhostWarned = useRef(false);
  const submitInFlightRef = useRef(false);
  const { login, error, clearError } = useAuth();

  useEffect(() => {
    if (localhostWarned.current) return;
    if (!Device.isDevice || Platform.OS === "web") return;
    const base = getApiBaseUrl();
    if (!/localhost|127\.0\.0\.1/i.test(base)) return;
    localhostWarned.current = true;
    Alert.alert(
      "Wrong API address for this phone",
      "The app is set to use localhost for the API. On a physical device, localhost is the phone, not your computer. Set EXPO_PUBLIC_API_URL to your computer's LAN IP or server URL, restart Expo, then try logging in again.",
      [{ text: "OK" }]
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      clearError();
    }, [clearError])
  );

  const onLogin = async () => {
    Keyboard.dismiss();
    const trimmed = email.trim();
    if (!trimmed || !password) {
      Alert.alert("Log in", "Enter your email and password.");
      return;
    }
    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setSubmitting(true);
    try {
      await login(trimmed, password);
      navigateToAppHome(router);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Could not sign in. Try again.";
      Alert.alert("Could not log in", msg, [{ text: "OK", style: "default" }]);
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Image
            source={require("../../assets/images/hivefivelogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>HiveFive</Text>
          <Text style={styles.subtitle}>Your campus community awaits</Text>

          <TextInput
            style={styles.input}
            placeholder="School email"
            value={email}
            onChangeText={(t) => {
              clearError();
              setEmail(t);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={(t) => {
              clearError();
              setPassword(t);
            }}
            secureTextEntry
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            onPress={onLogin}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Log in"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Log In</Text>
            )}
          </Pressable>

          <Text style={styles.linkText}>Forgot password?</Text>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Don’t have an account?</Text>
            <Pressable
              onPress={() => router.push("/signup")}
              accessibilityRole="button"
              accessibilityLabel="Go to sign up"
            >
              <Text style={styles.bottomLinkText}>Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 24,
    paddingBottom: 48,
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 32,
    textAlign: "center",
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 14,
    backgroundColor: "#F9FAFB",
  },
  primaryButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
  linkText: {
    color: "#2563EB",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 18,
  },
  bottomLinkText: {
    color: "#2563EB",
    fontWeight: "700",
    marginLeft: 4,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 24,
  },
  bottomText: {
    color: "#6B7280",
    fontWeight: "500",
  },
});
