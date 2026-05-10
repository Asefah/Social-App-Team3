import { Stack } from "expo-router";

export default function AppGroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="user/[username]"
        options={{
          headerShown: true,
          title: "Profile",
          headerBackTitle: "Back",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen name="explore" options={{ headerShown: false }} />
    </Stack>
  );
}
