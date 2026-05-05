import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {/* LOGO */}
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
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace("/(app)/home")}
        >
          <Text style={styles.primaryButtonText}>Log In</Text>
        </Pressable>

        <Text style={styles.linkText}>Forgot password?</Text>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Don’t have an account?</Text>
          <Text
            style={styles.bottomLinkText}
            onPress={() => router.push("/signup")}
          >
            {" "}
            Sign up
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
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
    marginTop: 24,
  },

  bottomText: {
    color: "#6B7280",
    fontWeight: "500",
  },
});
