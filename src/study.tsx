/*import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-reanimated/lib/typescript/Animated";
import { SafeAreaView } from "react-native-safe-area-context";

const categories = [
  "All",
  "Math",
  "Physics",
  "Chemistry",
  "Biology",
  "CS",
  "Engineering",
];
const filters = ["Trending", "New", "Top"];

export default function StudyScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFilter, setSelectedFilter] = useState("Trending");

  /*const filteredData;
  const sortedData

  const headerSection = (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Study Help</Text>
        <View style={styles.settingsRow}>
          <Ionicons name="search-outline" size={24} color="black"></Ionicons>
          <Ionicons name="funnel-outline" size={24} color="black"></Ionicons>
        </View>
      </View>

      <View style={styles.filtersSection}>
        {filters.map((filter) => {
          const isSelected = selectedFilter === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => setSelectedCategory(filter)}
              style={[
                styles.filterTag,
                isSelected
                  ? styles.selectedFilterTag
                  : styles.unselectedFilterTag,
              ]}
            >
              <Text
                style={[
                  styles.FilterText,
                  isSelected
                    ? styles.selectedFilterText
                    : styles.unselectedFilterText,
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.divider}></View>

      <View style={styles.categoriesSection}>
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
    </View>
  );
  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeTop}>
        {headerSection}
        <FlatList></FlatList>
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

  pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },

  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D1D5DB",
  },
});*/
