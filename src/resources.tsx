import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const categories = ["All", "Academic", "Health", "Food", "Housing", "Tech"];

const resources = [
  {
    id: "1",
    title: "W.E.B. Du Bois Library",
    description:
      "Access to millions of books, research databases, study spaces, and academic support services. Free tutoring available.",
    hours: "Mon-Fri • 8:00AM-11:00PM",
    isOpen: true,
    category: "Academic",
    image:
      "https://www.umass.edu/sites/default/files/2022-04/Du%20Bois%20Drone%202.JPG",
    link: "https://www.library.umass.edu/",
  },
  {
    id: "2",
    title: "University Health Services",
    description:
      "Primary care, mental health counseling, preventive care, and urgent care services.",
    hours: "Mon-Fri • 8:00AM-8:00PM",
    isOpen: false,
    category: "Health",
    image:
      "https://dailycollegian.com/wp-content/uploads/2020/04/20986089189_83cd4dacfc_k-900x600.jpg",
    link: "http://www.umass.edu/uhs/",
  },
  {
    id: "3",
    title: "Campus Food Pantry",
    description:
      "Free groceries and essentials for students experiencing food insecurity. No questions asked, confidential service.",
    hours: "Mon-Fri • 1:00PM-7:00PM",
    isOpen: false,
    category: "Food",
    image:
      "https://www.umass.edu/sites/default/files/2025-09/2025_um_EVENTS_campus_food_pantry_0079.JPG",
    link: "https://amherstsurvival.org/campus-pantry",
  },
  {
    id: "4",
    title: "IT Service Desk",
    description:
      "Technical support for campus wifi, student email, software licenses, device troubleshooting, and cybersecurity.",
    hours: "Mon-Fri • 8:30AM-7:00PM",
    isOpen: false,
    category: "Tech",
    image:
      "https://lh5.googleusercontent.com/proxy/KTERX0tDIAEVTRmAK1NtDeDHIJo46fDWpmSaUhpVdWjvpffNWhprm_yE-RX0Cil9YxONDs1_P4Y2AeFtCnrVyPUDOjL19DN5z9gh56m4eOje",
    link: "https://www.umass.edu/it/",
  },
];

export default function ResourcesScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredData =
    selectedCategory === "All"
      ? resources
      : resources.filter((item) => item.category === selectedCategory);

  const openWebsite = async (url: string) => {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    }
  };

  const renderResourceCard = ({ item }: { item: (typeof resources)[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardImageWrapper}>
        <Image
          source={{ uri: item.image }}
          style={styles.cardImage}
          contentFit="cover"
        />
        <View style={styles.imageOverlay} />
        <Text style={styles.imageTitle}>{item.title}</Text>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.hoursOfOperationRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.isOpen ? "green" : "red" },
            ]}
          />
          <Text style={styles.hoursText}>{item.hours}</Text>
        </View>

        <Pressable
          style={styles.visitWebsiteButton}
          onPress={() => openWebsite(item.link)}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonLabel}>Visit Website</Text>
            <Ionicons name="open-outline" size={16} color="white" />
          </View>
        </Pressable>
      </View>
    </View>
  );

  const headerSection = (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Campus Resources</Text>

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
          renderItem={renderResourceCard}
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
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardImageWrapper: {
    position: "relative",
    height: 170,
    width: "100%",
    justifyContent: "flex-end",
  },

  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },

  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.24)",
  },

  imageTitle: {
    position: "absolute",
    left: 16,
    bottom: 14,
    right: 16,
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },

  cardInfo: {
    padding: 16,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#374151",
    marginBottom: 12,
  },

  hoursOfOperationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginRight: 8,
  },

  hoursText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },

  visitWebsiteButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },

  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  buttonLabel: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },

  listContent: {
    paddingBottom: 180,
    paddingTop: 10,
  },
});
