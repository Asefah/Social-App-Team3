import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
