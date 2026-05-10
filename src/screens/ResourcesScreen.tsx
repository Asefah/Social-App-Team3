import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { listResources, type ResourceApi } from "@/lib/api";

export default function ResourcesScreen() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [resources, setResources] = useState<ResourceApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { categories: cats, resources: rows } = await listResources(
      token,
      selectedCategory === "All" ? undefined : selectedCategory
    );
    if (cats?.length) setCategories(cats);
    setResources(rows);
  }, [token, selectedCategory]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load resources");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const openWebsite = async (url: string) => {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    }
  };

  const renderResourceCard = ({ item }: { item: ResourceApi }) => (
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

      <View style={styles.divider} />

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

      <View style={styles.divider} />
    </View>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeTop}>
        {headerSection}
        {error ? <Text style={styles.bannerError}>{error}</Text> : null}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            data={resources}
            renderItem={renderResourceCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No resources in this category.</Text>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  safeTop: { flex: 1, backgroundColor: "#FFFFFF" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  iconGroup: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#D1D5DB" },
  categorySection: { paddingTop: 12, paddingBottom: 4 },
  categoryScrollContent: { paddingHorizontal: 20, gap: 12, paddingBottom: 10 },
  categoryTag: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCategoryTag: { backgroundColor: "#2563EB" },
  unselectedCategoryTag: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  categoryText: { fontSize: 14, fontWeight: "600" },
  selectedCategoryText: { color: "white" },
  unselectedCategoryText: { color: "#374151" },
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
  cardImage: { ...StyleSheet.absoluteFillObject },
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
  cardInfo: { padding: 16 },
  description: { fontSize: 14, lineHeight: 21, color: "#374151", marginBottom: 12 },
  hoursOfOperationRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginRight: 8,
  },
  hoursText: { fontSize: 13, color: "#4B5563", fontWeight: "500" },
  visitWebsiteButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  buttonContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  buttonLabel: { color: "white", fontSize: 15, fontWeight: "700" },
  listContent: { paddingBottom: 180, paddingTop: 10 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 24 },
  emptyText: { textAlign: "center", color: "#6B7280", marginTop: 24, paddingHorizontal: 24 },
  bannerError: { color: "#DC2626", textAlign: "center", paddingVertical: 8 },
});
