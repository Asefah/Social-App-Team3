/*import Ionicons from "@expo/vector-icons/Ionicons";
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
import { categories, filters, posts } from "../constants/studyData";

export default function StudyScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFilter, setSelectedFilter] = useState("Trending");

  const filteredData
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { categories, filters, studyPosts } from "../constants/studyData";

export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState("Trending");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts =
    selectedCategory === "All"
      ? studyPosts
      : studyPosts.filter((post) => post.category === selectedCategory);

  const renderPost = ({ item }: { item: (typeof studyPosts)[0] }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />

        <View style={styles.postContent}>
          <View style={styles.authorRow}>
            <Text style={styles.author}>{item.author}</Text>
            <Text style={styles.time}> · {item.time}</Text>
          </View>

          <Text style={styles.question}>{item.title}</Text>

          <View style={styles.tagRow}>
            {item.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.answerBox}>
            <View style={styles.answerHeader}>
              <Ionicons name="ribbon-outline" size={14} color="#16A34A" />
              <Text style={styles.answerBy}>
                Top answer by {item.topAnswerBy}
              </Text>
            </View>
            <Text style={styles.answerText}>{item.answer}</Text>
          </View>

          <View style={styles.postFooter}>
            <View style={styles.footerLeft}>
              <Ionicons name="chevron-up-outline" size={18} color="#374151" />
              <Text style={styles.footerText}>{item.upvotes}</Text>

              <Ionicons
                name="chatbox-outline"
                size={18}
                color="#374151"
                style={{ marginLeft: 12 }}
              />
              <Text style={styles.footerText}>{item.comments}</Text>
            </View>

            <Text style={styles.viewAnswers}>View answers</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeTop}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Study Help</Text>

          <View style={styles.iconRow}>
            <Ionicons name="search-outline" size={24} color="#111827" />
            <Ionicons name="funnel-outline" size={24} color="#111827" />
          </View>
        </View>

        <View style={styles.filterRow}>
          {filters.map((filter) => {
            const isSelected = selectedFilter === filter;

            return (
              <Pressable
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[
                  styles.filterButton,
                  isSelected
                    ? styles.selectedFilterButton
                    : styles.unselectedFilterButton,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
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

        <View style={styles.divider} />

        <View style={styles.categoryWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {categories.map((category) => {
              const isSelected = selectedCategory === category;

              return (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.categoryButton,
                    isSelected
                      ? styles.selectedCategoryButton
                      : styles.unselectedCategoryButton,
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

        <View style={styles.divider} />

        <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />

        <Pressable style={[styles.addButton, { bottom: insets.bottom + 70 }]}>
          <Ionicons name="add" size={28} color="white" />
        </Pressable>
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

  iconRow: {
    flexDirection: "row",
    gap: 18,
    alignItems: "center",
  },

  filterRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },

  filterButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedFilterButton: {
    backgroundColor: "#2563EB",
  },

  unselectedFilterButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },

  filterText: {
    fontSize: 14,
    fontWeight: "600",
  },

  selectedFilterText: {
    color: "white",
  },

  unselectedFilterText: {
    color: "#374151",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D1D5DB",
  },

  categoryWrapper: {
    paddingTop: 12,
    paddingBottom: 4,
  },

  categoryRow: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 10,
  },

  categoryButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedCategoryButton: {
    backgroundColor: "#A855F7",
  },

  unselectedCategoryButton: {
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

  listContent: {
    paddingBottom: 180,
  },

  postCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D1D5DB",
  },

  postHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    backgroundColor: "#E5E7EB",
  },

  postContent: {
    flex: 1,
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  author: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },

  time: {
    fontSize: 13,
    color: "#6B7280",
  },

  question: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
    color: "#111827",
    marginBottom: 12,
  },

  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  tag: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  tagText: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "500",
  },

  answerBox: {
    backgroundColor: "#F9FAFB",
    borderLeftWidth: 3,
    borderLeftColor: "#22C55E",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },

  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },

  answerBy: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },

  answerText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#374151",
  },

  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  footerText: {
    fontSize: 13,
    color: "#374151",
    marginLeft: 4,
  },

  viewAnswers: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
  },

  addButton: {
    position: "absolute",
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#A855F7",
    alignItems: "center",
    justifyContent: "center",
  },
});