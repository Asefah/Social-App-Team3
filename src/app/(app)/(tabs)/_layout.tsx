import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "@/context/AuthContext";

export default function TabLayout() {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={"house"} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="events">
        <NativeTabs.Trigger.Label>Events</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={"calendar"} md="calendar_add_on" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="study">
        <NativeTabs.Trigger.Label>Study</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={"book"} md="book" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="resources">
        <NativeTabs.Trigger.Label>Resources</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={"square.grid.2x2.fill"} md="grid_3x3" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={"person"} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
