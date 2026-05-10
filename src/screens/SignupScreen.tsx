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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { FIVE_COLLEGE_OPTIONS } from "@/constants/fiveColleges";
import { useAuth } from "@/context/AuthContext";
import { ApiError, getApiBaseUrl } from "@/lib/api";
import { navigateToAppHome } from "@/lib/navigateAfterAuth";

export default function SignupScreen() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [major, setMajor] = useState("");
  const [classYear, setClassYear] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const localhostWarned = useRef(false);
  const submitInFlightRef = useRef(false);
  const { register, error, clearError } = useAuth();

  useEffect(() => {
    if (localhostWarned.current) return;
    if (!Device.isDevice || Platform.OS === "web") return;
    const base = getApiBaseUrl();
    if (!/localhost|127\.0\.0\.1/i.test(base)) return;
    localhostWarned.current = true;
    Alert.alert(
      "Wrong API address for this phone",
      "The app is set to use localhost for the API. On a physical device, localhost is the phone, not your computer. Set EXPO_PUBLIC_API_URL to your computer's LAN IP or server URL (e.g. http://192.168.1.5:3000), restart Expo with a cleared cache if needed, then sign up again.",
      [{ text: "OK" }]
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      clearError();
      setLocalError(null);
    }, [clearError])
  );

  const onSignup = async () => {
    setLocalError(null);
    clearError();
    Keyboard.dismiss();

    const u = username.trim();
    const email = schoolEmail.trim();
    const full = name.trim();

    if (u.length < 3) {
      const msg = "Username must be at least 3 characters.";
      setLocalError(msg);
      Alert.alert("Sign up", msg);
      return;
    }
    if (!full) {
      const msg = "Enter your full name.";
      setLocalError(msg);
      Alert.alert("Sign up", msg);
      return;
    }
    if (!email) {
      const msg = "Enter your school email.";
      setLocalError(msg);
      Alert.alert("Sign up", msg);
      return;
    }
    if (password.length < 8) {
      const msg = "Password must be at least 8 characters.";
      setLocalError(msg);
      Alert.alert("Sign up", msg);
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      Alert.alert("Sign up", "Passwords do not match.");
      return;
    }
    if (!selectedSchool) {
      setLocalError("Select which Five College you attend.");
      Alert.alert("Sign up", "Select which Five College you attend.");
      return;
    }
    if (!major.trim()) {
      setLocalError("Enter your major.");
      Alert.alert("Sign up", "Enter your major.");
      return;
    }
    if (!classYear.trim()) {
      setLocalError("Enter your class year (e.g. Junior, Sophomore).");
      Alert.alert("Sign up", "Enter your class year.");
      return;
    }
    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setSubmitting(true);
    try {
      await register({
        username: u,
        email,
        password,
        fullName: full,
        userSchool: selectedSchool,
        userMajor: major.trim(),
        userYear: classYear.trim(),
      });
      navigateToAppHome(router);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : "Could not create account. Try again.";
      Alert.alert(
        "Could not sign up",
        msg,
        [{ text: "OK", style: "default" }]
      );
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  const combinedError = localError || error;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require("../../assets/images/hivefivelogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join students across the Five Colleges
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Username (letters, numbers, _)"
            value={username}
            onChangeText={(t) => {
              clearError();
              setLocalError(null);
              setUsername(t);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Full name"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="School email"
            value={schoolEmail}
            onChangeText={(t) => {
              clearError();
              setLocalError(null);
              setSchoolEmail(t);
            }}
            autoCapitalize="none"
          />

          <Text style={styles.fieldHeading}>College</Text>
          <Text style={styles.fieldHint}>
            Which of the Five Colleges do you attend?
          </Text>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.schoolRow}
            keyboardShouldPersistTaps="handled"
          >
            {FIVE_COLLEGE_OPTIONS.map((school) => {
              const on = selectedSchool === school;
              return (
                <Pressable
                  key={school}
                  onPress={() => {
                    clearError();
                    setLocalError(null);
                    setSelectedSchool(school);
                  }}
                  style={[styles.schoolChip, on && styles.schoolChipOn]}
                >
                  <Text
                    style={[
                      styles.schoolChipText,
                      on && styles.schoolChipTextOn,
                    ]}
                    numberOfLines={2}
                  >
                    {school}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.fieldHeading}>Major</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Biology, Computer Science"
            value={major}
            onChangeText={(t) => {
              clearError();
              setLocalError(null);
              setMajor(t);
            }}
          />

          <Text style={styles.fieldHeading}>Class year</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Freshman, Junior, 2nd year PhD"
            value={classYear}
            onChangeText={(t) => {
              clearError();
              setLocalError(null);
              setClassYear(t);
            }}
          />

          <TextInput
            style={styles.input}
            placeholder="Password (min 8 characters)"
            value={password}
            onChangeText={(t) => {
              clearError();
              setLocalError(null);
              setPassword(t);
            }}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={(t) => {
              clearError();
              setLocalError(null);
              setConfirmPassword(t);
            }}
            secureTextEntry
          />
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 12) + 8 },
          ]}
        >
          {combinedError ? (
            <Text style={styles.errorText}>{combinedError}</Text>
          ) : null}

          <Pressable
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            onPress={onSignup}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Sign up"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign Up</Text>
            )}
          </Pressable>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Already have an account?</Text>
            <Pressable
              onPress={() => router.push("/login")}
              accessibilityRole="button"
              accessibilityLabel="Go to log in"
            >
              <Text style={styles.linkText}>Log in</Text>
            </Pressable>
          </View>
        </View>
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
    paddingHorizontal: 28,
    paddingBottom: 16,
    paddingTop: 8,
  },
  footer: {
    paddingHorizontal: 28,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  logo: {
    width: 160,
    height: 160,
    alignSelf: "center",
    marginBottom: 12,
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
    marginBottom: 20,
    textAlign: "center",
  },
  fieldHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    marginTop: 4,
  },
  fieldHint: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 10,
  },
  schoolRow: {
    gap: 10,
    paddingBottom: 14,
    paddingRight: 4,
  },
  schoolChip: {
    maxWidth: 160,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  schoolChipOn: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  schoolChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  schoolChipTextOn: {
    color: "#FFFFFF",
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
    marginTop: 0,
    marginBottom: 4,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 4,
  },
  bottomText: {
    color: "#6B7280",
    fontWeight: "500",
  },
  linkText: {
    color: "#2563EB",
    fontWeight: "700",
  },
});
