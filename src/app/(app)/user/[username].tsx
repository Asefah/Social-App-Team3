import { useLocalSearchParams, useNavigation } from "expo-router";
import { useLayoutEffect } from "react";

import ProfileScreen from "../../../screens/ProfileScreen";

export default function UserProfileRoute() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const navigation = useNavigation();
  const raw = typeof username === "string" ? username : username?.[0];
  const profileUsername = raw ? decodeURIComponent(raw) : "";

  useLayoutEffect(() => {
    navigation.setOptions({
      title: profileUsername ? `@${profileUsername}` : "Profile",
    });
  }, [navigation, profileUsername]);

  return <ProfileScreen profileUsername={profileUsername} />;
}
