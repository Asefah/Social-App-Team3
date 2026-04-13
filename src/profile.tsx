import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreens() {
  const [activeTab, setActiveTab] = useState("posts");
  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeTop}>
        <View style={styles.headerRow}>
          <Text style={styles.username}>puja_pradhan</Text>
          <Ionicons name="settings-outline" size={24} color="black"></Ionicons>
        </View>

        <View style={styles.divider}></View>

        <View style={styles.profileRow}>
          <Image
            source={
              //uri: "https://i.pinimg.com/236x/64/f0/20/64f020d2e05d7a315855002786442417.jpg",
              require("../../assets/images/IMG_6489.jpeg")
            }
            style={styles.avatar}
          ></Image>
          <View style={styles.profileStatsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>1,350</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>3,092</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>248</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        <View style={styles.bioSection}>
          <Text style={styles.name}>Puja Pradhan</Text>
          <Text style={styles.subtitle}>UMass Amherst • Biology • Junior</Text>
          <Text style={styles.bio}>
            RA | Aspiring Doctor | Teaching-Assistant
          </Text>
        </View>

        <View style={styles.buttonSection}>
          <View style={styles.buttonRow}>
            <Pressable style={styles.button}>
              <Text style={styles.primaryButtonText}>Edit Profile</Text>
            </Pressable>
            <Pressable style={styles.button}>
              <Text style={styles.secondaryButtonText}>Share Profile</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.tabSection}>
          <View style={styles.tabRow}>
            <View style={styles.tabHalf}>
              <Pressable
                style={styles.tabButton}
                onPress={() => setActiveTab("posts")}
              >
                <Ionicons
                  name="apps-outline"
                  size={20}
                  color={activeTab === "posts" ? "black" : "gray"}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "posts"
                      ? styles.activeTabText
                      : styles.inactiveTabText,
                  ]}
                >
                  Posts
                </Text>
              </Pressable>

              <View
                style={[
                  styles.tabIndicator,
                  activeTab === "posts"
                    ? styles.activeIndicator
                    : styles.inactiveIndicator,
                ]}
              />
            </View>

            <View style={styles.tabHalf}>
              <Pressable
                style={styles.tabButton}
                onPress={() => setActiveTab("saved")}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={20}
                  color={activeTab === "saved" ? "black" : "gray"}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "saved"
                      ? styles.activeTabText
                      : styles.inactiveTabText,
                  ]}
                >
                  Saved
                </Text>
              </Pressable>

              <View
                style={[
                  styles.tabIndicator,
                  activeTab === "saved"
                    ? styles.activeIndicator
                    : styles.inactiveIndicator,
                ]}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  safeTop: {},

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },

  username: {
    fontSize: 20,
    fontWeight: 500,
    color: "black",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D1D5DB",
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 20,
  },

  profileStatsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 20,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
    backgroundColor: "grey",
  },

  stat: {
    alignItems: "center",
  },

  statNumber: {
    fontSize: 18,
    fontWeight: "700",
  },

  statLabel: {
    fontSize: 14,
    color: "gray",
    marginTop: 2,
  },

  bioSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 14,
    color: "gray",
    marginBottom: 5,
  },

  bio: {
    fontSize: 14,
    color: "black",
  },

  buttonSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 15,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 18,
  },

  button: {
    flex: 1,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  tabSection: {
    paddingTop: 5,
  },

  tabRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#D1D5DB",
  },

  tabHalf: {
    flex: 1,
  },

  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },

  tabText: {
    fontSize: 15,
    fontWeight: "500",
  },

  activeTabText: {
    color: "black",
  },

  inactiveTabText: {
    color: "gray",
  },

  tabIndicator: {
    height: 2,
  },

  activeIndicator: {
    backgroundColor: "black",
  },

  inactiveIndicator: {
    backgroundColor: "transparent",
  },
});
