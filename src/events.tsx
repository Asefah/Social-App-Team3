import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const categories = ["All", "Academic", "Social", "Sports", "Career", "Clubs"];

const events = [
  {
    id: "1",
    title: "Spring Festival 2026",
    date: "April 5th, 2026",
    time: "2:00PM-7:00PM",
    location: "Main Quad",
    attendance: "248 going",
    category: "Social",
    image: "https://newengland.com/wp-content/uploads/2024/07/MOTT_BigE.jpg",
  },
  {
    id: "2",
    title: "ECE Career Fair",
    date: "May 1st, 2026",
    time: "12:00PM-4:00PM",
    location: "Campus Center Auditorium",
    attendance: "156 going",
    category: "Career",
    image:
      "https://www.umass.edu/engineering/sites/g/files/ijdqth166/files/2024-09/Career%20Fair.jpg",
  },
];

export default function EventsScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredData =
    selectedCategory === "All"
      ? events
      : events.filter((item) => item.category === selectedCategory);

  const renderEventsCard = ({ item }: { item: (typeof events)[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardImageWrapper}>
        <Image
          source={{ uri: item.image }}
          style={styles.cardImage}
          contentFit="cover"
        />

        <View style={styles.attendanceIndicator}>
          <Text style={styles.attendanceIndicatorText}>{item.attendance}</Text>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.eventTitle}>{item.title}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#4B5563" />
          <Text style={styles.infoText}>{item.date}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color="#4B5563" />
          <Text style={styles.infoText}>{item.time}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#4B5563" />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>

        <Pressable style={styles.rsvpButton}>
          <Text style={styles.rsvpLabel}>RSVP</Text>
        </Pressable>
      </View>
    </View>
  );

  const headerSection = (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Campus Events</Text>

        <View style={styles.iconGroup}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="search-outline" size={22} color="black" />
          </Pressable>

          <Pressable style={styles.iconButton}>
            <Ionicons name="funnel-outline" size={22} color="black" />
          </Pressable>
        </View>
      </View>

      <View style={styles.divider}></View>

      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryTag,
                  isSelected
                    ? styles.selectedCategoryTag
                    : styles.unselectedCategoryTag,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected
                      ? styles.selectedCategoryText
                      : styles.unselectedCategoryText,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.divider}></View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeTop}>
        {headerSection}
        <FlatList
          data={filteredData}
          renderItem={renderEventsCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        ></FlatList>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  safeTop: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D1D5DB",
  },

  categorySection: {
    paddingTop: 12,
    paddingBottom: 4,
  },

  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 10,
  },

  categoryTag: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedCategoryTag: {
    backgroundColor: "#2563EB",
  },

  unselectedCategoryTag: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },

  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },

  selectedCategoryText: {
    color: "white",
  },

  unselectedCategoryText: {
    color: "#374151",
  },

  card: {
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  cardImageWrapper: {
    position: "relative",
    height: 230,
    width: "100%",
  },

  cardImage: {
    width: "100%",
    height: "100%",
  },

  attendanceIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },

  attendanceIndicatorText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },

  cardInfo: {
    padding: 20,
  },

  eventTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 18,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  infoText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4B5563",
  },

  rsvpButton: {
    marginTop: 16,
    backgroundColor: "#2563EB",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },

  rsvpLabel: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },

  listContent: {
    paddingBottom: 180,
    paddingTop: 10,
  },
});
