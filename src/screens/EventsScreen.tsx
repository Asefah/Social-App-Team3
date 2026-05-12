import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { categories, events } from "../constants/eventData";
import { api, EventItem } from "../services/api";

const DEMO_USERNAME = "demo_user";

const staticEvents: EventItem[] = events.map((event) => {
  const rsvps = Number.parseInt(event.attendance, 10) || 0;

  return {
    ...event,
    username: DEMO_USERNAME,
    rawDate: "",
    rawTime: "",
    rsvps,
  };
});

export default function EventsScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [eventList, setEventList] = useState<EventItem[]>(staticEvents);
  const [rsvps, setRsvps] = useState<Record<string, boolean>>({});
  const [apiStatus, setApiStatus] = useState("Using saved sample events");
  const [draftEvent, setDraftEvent] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
  });

  useEffect(() => {
    api
      .getEvents()
      .then((backendEvents) => {
        if (backendEvents.length > 0) {
          setEventList(backendEvents);
          setApiStatus("Connected to backend events");
        }
      })
      .catch(() => setApiStatus("Backend offline: using sample events"));
  }, []);

  const filteredData =
    selectedCategory === "All"
      ? eventList
      : eventList.filter((item) => item.category === selectedCategory);

  const createEvent = async () => {
    const title = draftEvent.title.trim();
    const eventDate = draftEvent.date.trim();
    const eventTime = draftEvent.time.trim();
    const location = draftEvent.location.trim();

    if (!title || !eventDate || !eventTime || !location) return;

    const optimisticEvent: EventItem = {
      id: `local-${Date.now()}`,
      username: DEMO_USERNAME,
      title,
      date: eventDate,
      rawDate: eventDate,
      time: eventTime,
      rawTime: eventTime,
      location,
      attendance: "0 going",
      rsvps: 0,
      category: selectedCategory === "All" ? "Other" : selectedCategory,
      image:
        "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200",
    };

    setDraftEvent({ title: "", date: "", time: "", location: "" });
    setEventList((current) => [optimisticEvent, ...current]);

    try {
      const savedEvent = await api.createEvent({
        username: DEMO_USERNAME,
        eventName: title,
        eventDate,
        eventTime,
        eventLocation: location,
        category: optimisticEvent.category,
      });

      setEventList((current) =>
        current.map((event) =>
          event.id === optimisticEvent.id ? savedEvent : event
        )
      );
      setApiStatus("Event saved to backend");
    } catch {
      setApiStatus("Backend offline: event added locally");
    }
  };

  const deleteEvent = async (event: EventItem) => {
    setEventList((current) => current.filter((item) => item.id !== event.id));

    if (event.id.startsWith("local-")) {
      setApiStatus("Event deleted locally");
      return;
    }

    try {
      await api.deleteEvent(event.id, event.username ?? DEMO_USERNAME);
      setApiStatus("Event deleted from backend");
    } catch {
      setApiStatus("Backend offline: event removed locally");
    }
  };

  const toggleRsvp = async (event: EventItem) => {
    const eventId = event.id;
    const isGoing = rsvps[eventId];

    setRsvps((current) => ({
      ...current,
      [eventId]: !current[eventId],
    }));

    setEventList((current) =>
      current.map((item) => {
        if (item.id !== eventId) return item;

        const nextRsvps = item.rsvps + (isGoing ? -1 : 1);
        return {
          ...item,
          rsvps: Math.max(nextRsvps, 0),
          attendance: `${Math.max(nextRsvps, 0)} going`,
        };
      })
    );

    if (eventId.startsWith("local-")) return;

    try {
      const updatedEvent = isGoing
        ? await api.removeRsvp(eventId, DEMO_USERNAME)
        : await api.addRsvp(eventId, DEMO_USERNAME);

      setEventList((current) =>
        current.map((item) => (item.id === eventId ? updatedEvent : item))
      );
      setApiStatus(isGoing ? "RSVP removed from backend" : "RSVP saved to backend");
    } catch {
      setApiStatus("Backend offline: RSVP saved locally");
    }
  };

  const renderEventsCard = ({ item }: { item: EventItem }) => {
    const isGoing = rsvps[item.id];

    return (
      <View style={styles.card}>
        <View style={styles.cardImageWrapper}>
          <Image
            source={{ uri: item.image }}
            style={styles.cardImage}
            contentFit="cover"
          />

          <View style={styles.attendanceIndicator}>
            <Text style={styles.attendanceIndicatorText}>
              {isGoing ? "You're going" : item.attendance}
            </Text>
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
            onPress={() => toggleRsvp(item)}
            accessibilityRole="button"
            accessibilityLabel={`${isGoing ? "Cancel RSVP for" : "RSVP to"} ${item.title}`}
            style={[styles.rsvpButton, isGoing && styles.rsvpButtonActive]}
          >
            <Ionicons
              name={isGoing ? "checkmark-circle" : "add-circle-outline"}
              size={20}
              color="white"
            />
            <Text style={styles.rsvpLabel}>{isGoing ? "Going" : "RSVP"}</Text>
          </Pressable>

          <Pressable
            onPress={() => deleteEvent(item)}
            accessibilityRole="button"
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={18} color="#B91C1C" />
            <Text style={styles.deleteLabel}>Delete Event</Text>
          </Pressable>
        </View>
      </View>
    );
  };

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

      <View style={styles.createSection}>
        <TextInput
          value={draftEvent.title}
          onChangeText={(title) =>
            setDraftEvent((current) => ({ ...current, title }))
          }
          placeholder="Event name"
          style={styles.createInput}
        />
        <View style={styles.formRow}>
          <TextInput
            value={draftEvent.date}
            onChangeText={(date) =>
              setDraftEvent((current) => ({ ...current, date }))
            }
            placeholder="YYYY-MM-DD"
            style={[styles.createInput, styles.formHalf]}
          />
          <TextInput
            value={draftEvent.time}
            onChangeText={(time) =>
              setDraftEvent((current) => ({ ...current, time }))
            }
            placeholder="HH:MM"
            style={[styles.createInput, styles.formHalf]}
          />
        </View>
        <TextInput
          value={draftEvent.location}
          onChangeText={(location) =>
            setDraftEvent((current) => ({ ...current, location }))
          }
          placeholder="Location"
          style={styles.createInput}
        />
        <Pressable
          onPress={createEvent}
          accessibilityRole="button"
          style={styles.createButton}
        >
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.createButtonText}>Create Event</Text>
        </Pressable>
        <Text style={styles.apiStatus}>{apiStatus}</Text>
      </View>
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

  createSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },

  createInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: "#F9FAFB",
  },

  formRow: {
    flexDirection: "row",
    gap: 10,
  },

  formHalf: {
    flex: 1,
  },

  createButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  createButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },

  apiStatus: {
    color: "#6B7280",
    fontSize: 12,
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
    flexDirection: "row",
    gap: 8,
    paddingVertical: 16,
  },

  rsvpButtonActive: {
    backgroundColor: "#16A34A",
  },

  rsvpLabel: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },

  deleteButton: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 12,
  },

  deleteLabel: {
    color: "#B91C1C",
    fontSize: 15,
    fontWeight: "700",
  },

  listContent: {
    paddingBottom: 180,
    paddingTop: 10,
  },
});
