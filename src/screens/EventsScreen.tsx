import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import {
  ApiError,
  createEvent,
  listEvents,
  rsvpEvent,
  type EventApi,
} from "@/lib/api";

const EVENT_CATEGORIES = [
  "All",
  "Academic",
  "Social",
  "Sports",
  "Career",
  "Clubs",
  "Recreational",
  "Other",
] as const;

export default function EventsScreen() {
  const { token } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [events, setEvents] = useState<EventApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventCategory, setEventCategory] = useState<string>("Social");
  const [eventImageUrl, setEventImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const { events: rows } = await listEvents(
      token,
      selectedCategory === "All" ? undefined : selectedCategory
    );
    setEvents(rows);
  }, [token, selectedCategory]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load events");
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

  const onRsvp = async (item: EventApi) => {
    if (!token || item.hasRsvped) return;
    try {
      const { event } = await rsvpEvent(token, item.id);
      setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const body = e.body as { event?: EventApi } | undefined;
        if (body?.event) {
          setEvents((prev) =>
            prev.map((ev) => (ev.id === body.event!.id ? body.event! : ev))
          );
        }
        Alert.alert("Already going", e.message);
        return;
      }
    }
  };

  const submitCreate = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await createEvent(token, {
        eventName: eventName.trim(),
        eventDate: eventDate.trim(),
        eventTime: eventTime.trim(),
        eventLocation: eventLocation.trim(),
        category: eventCategory,
        imageUrl: eventImageUrl.trim() || null,
      });
      setEventName("");
      setEventDate("");
      setEventTime("");
      setEventLocation("");
      setEventImageUrl("");
      setCreateOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create event");
    } finally {
      setSubmitting(false);
    }
  };

  const renderEventsCard = ({ item }: { item: EventApi }) => (
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

        <Pressable
          style={[
            styles.rsvpButton,
            item.hasRsvped && styles.rsvpButtonDone,
            (!token || item.hasRsvped) && styles.rsvpButtonDisabled,
          ]}
          onPress={() => void onRsvp(item)}
          disabled={!token || item.hasRsvped}
        >
          <Text
            style={[styles.rsvpLabel, item.hasRsvped && styles.rsvpLabelDone]}
          >
            {item.hasRsvped ? "Going" : "RSVP"}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const headerSection = (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Campus Events</Text>

        <View style={styles.iconGroup}>
          <Pressable style={styles.iconButton} onPress={() => setCreateOpen(true)}>
            <Ionicons name="add-circle-outline" size={26} color="black" />
          </Pressable>
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
          {EVENT_CATEGORIES.map((category) => {
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
            data={events}
            renderItem={renderEventsCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No events in this category.</Text>
            }
          />
        )}
      </SafeAreaView>

      <Modal visible={createOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create event</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Event title"
              value={eventName}
              onChangeText={setEventName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Date (YYYY-MM-DD)"
              value={eventDate}
              onChangeText={setEventDate}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Time (HH:MM)"
              value={eventTime}
              onChangeText={setEventTime}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Location"
              value={eventLocation}
              onChangeText={setEventLocation}
            />
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.catPickRow}>
                {EVENT_CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setEventCategory(c)}
                    style={[
                      styles.catPick,
                      eventCategory === c && styles.catPickOn,
                    ]}
                  >
                    <Text
                      style={[
                        styles.catPickText,
                        eventCategory === c && styles.catPickTextOn,
                      ]}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <TextInput
              style={styles.modalInput}
              placeholder="Image URL (optional)"
              value={eventImageUrl}
              onChangeText={setEventImageUrl}
              autoCapitalize="none"
            />
            <View style={styles.modalRow}>
              <Pressable
                style={styles.modalSecondary}
                onPress={() => setCreateOpen(false)}
              >
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalPrimary}
                onPress={submitCreate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalPrimaryText}>Create</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  iconGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  cardImageWrapper: { position: "relative", height: 230, width: "100%" },
  cardImage: { width: "100%", height: "100%" },
  attendanceIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  attendanceIndicatorText: { fontSize: 16, fontWeight: "700", color: "#374151" },
  cardInfo: { padding: 20 },
  eventTitle: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 18 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  infoText: { fontSize: 16, fontWeight: "500", color: "#4B5563" },
  rsvpButton: {
    marginTop: 16,
    backgroundColor: "#2563EB",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  rsvpLabel: { color: "white", fontSize: 17, fontWeight: "700" },
  rsvpButtonDone: {
    backgroundColor: "#D1FAE5",
  },
  rsvpButtonDisabled: {
    opacity: 0.75,
  },
  rsvpLabelDone: { color: "#065F46", fontSize: 17, fontWeight: "700" },
  listContent: { paddingBottom: 180, paddingTop: 10 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 24 },
  emptyText: { textAlign: "center", color: "#6B7280", marginTop: 24, paddingHorizontal: 24 },
  bannerError: { color: "#DC2626", textAlign: "center", paddingVertical: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, maxHeight: "92%" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#111827" },
  modalInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  fieldLabel: { fontWeight: "600", marginBottom: 8, color: "#374151" },
  catPickRow: { flexDirection: "row", gap: 8, marginBottom: 12, paddingVertical: 4 },
  catPick: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  catPickOn: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  catPickText: { fontSize: 13, color: "#374151", fontWeight: "600" },
  catPickTextOn: { color: "#fff" },
  modalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 },
  modalPrimary: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  modalPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  modalSecondary: { paddingHorizontal: 12, paddingVertical: 12, justifyContent: "center" },
  modalSecondaryText: { color: "#374151", fontWeight: "600", fontSize: 16 },
});
