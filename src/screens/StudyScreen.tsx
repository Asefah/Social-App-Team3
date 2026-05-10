import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import {
  addComment,
  createForumPost,
  forumPostCategories,
  setForumPostVote,
  listComments,
  listForumPosts,
  type CommentApi,
  type StudyPostApi,
} from "@/lib/api";

const FILTERS = ["Trending", "New", "Top"] as const;

function studyNetScore(p: StudyPostApi) {
  return (p.upvotes ?? 0) - (p.downvotes ?? 0);
}

function sortStudyPosts(
  posts: StudyPostApi[],
  filter: (typeof FILTERS)[number]
): StudyPostApi[] {
  const copy = [...posts];
  if (filter === "New") {
    return copy.sort(
      (a, b) => Number(b.forumPostId) - Number(a.forumPostId)
    );
  }
  return copy.sort((a, b) => {
    const diff = studyNetScore(b) - studyNetScore(a);
    if (diff !== 0) return diff;
    return Number(b.forumPostId) - Number(a.forumPostId);
  });
}

export default function StudyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const [selectedFilter, setSelectedFilter] =
    useState<(typeof FILTERS)[number]>("Trending");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [rawPosts, setRawPosts] = useState<StudyPostApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [composeOpen, setComposeOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState("Other");
  const [submitting, setSubmitting] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [activePost, setActivePost] = useState<StudyPostApi | null>(null);
  const [comments, setComments] = useState<CommentApi[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const loadCategories = useCallback(async () => {
    const { categories: cats } = await forumPostCategories(token);
    setCategories(cats.length ? cats : ["All", "Other"]);
  }, [token]);

  const loadPosts = useCallback(async () => {
    setError(null);
    const { studyPosts } = await listForumPosts(token, {
      kind: "study",
      category: selectedCategory === "All" ? undefined : selectedCategory,
    });
    setRawPosts(studyPosts);
  }, [token, selectedCategory]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadCategories();
        if (!cancelled) await loadPosts();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load study posts");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCategories, loadPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCategories();
      await loadPosts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, [loadCategories, loadPosts]);

  const filteredPosts = useMemo(
    () => sortStudyPosts(rawPosts, selectedFilter),
    [rawPosts, selectedFilter]
  );

  const openComments = async (item: StudyPostApi) => {
    setActivePost(item);
    setCommentsOpen(true);
    setLoadingComments(true);
    setCommentDraft("");
    try {
      const { comments: rows } = await listComments(item.forumPostId);
      setComments(rows);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!token || !activePost || !commentDraft.trim()) return;
    try {
      await addComment(token, activePost.forumPostId, commentDraft.trim());
      setCommentDraft("");
      const { comments: rows } = await listComments(activePost.forumPostId);
      setComments(rows);
      setRawPosts((prev) =>
        prev.map((p) =>
          p.forumPostId === activePost.forumPostId
            ? { ...p, comments: rows.length }
            : p
        )
      );
    } catch {
      /* ignore */
    }
  };

  const onStudyVote = async (item: StudyPostApi, direction: 1 | -1) => {
    if (!token) return;
    const cur =
      item.myVote ??
      (item.likedByMe ? 1 : item.downvotedByMe ? -1 : 0);
    const nextVote = cur === direction ? 0 : direction;
    try {
      const { studyPost } = await setForumPostVote(
        token,
        item.forumPostId,
        nextVote
      );
      setRawPosts((prev) =>
        prev.map((p) =>
          p.forumPostId === studyPost.forumPostId ? studyPost : p
        )
      );
    } catch {
      /* ignore */
    }
  };

  const submitNewQuestion = async () => {
    if (!token || !newTitle.trim() || !newBody.trim()) return;
    setSubmitting(true);
    try {
      await createForumPost(token, {
        kind: "study",
        category: newCategory,
        title: newTitle.trim(),
        content: newBody.trim(),
      });
      setNewTitle("");
      setNewBody("");
      setComposeOpen(false);
      await loadPosts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create post");
    } finally {
      setSubmitting(false);
    }
  };

  const goToUserProfile = (username: string) => {
    if (user?.username === username) {
      router.push("/(app)/(tabs)/profile");
    } else {
      router.push(`/(app)/user/${encodeURIComponent(username)}`);
    }
  };

  const renderPost = ({ item }: { item: StudyPostApi }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />

        <View style={styles.postContent}>
          <Pressable
            style={styles.authorRow}
            onPress={() => goToUserProfile(item.author)}
            hitSlop={{ top: 4, bottom: 4 }}
          >
            <Text style={styles.author}>{item.author}</Text>
            <Text style={styles.time}> · {item.time}</Text>
          </Pressable>

          <Text style={styles.question}>{item.title}</Text>

          {item.tags.length > 0 ? (
            <View style={styles.tagRow}>
              {item.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

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
              <Pressable
                style={styles.voteHit}
                onPress={() => onStudyVote(item, 1)}
                disabled={!token}
              >
                <Ionicons
                  name={
                    item.myVote === 1 || item.likedByMe
                      ? "chevron-up"
                      : "chevron-up-outline"
                  }
                  size={18}
                  color={
                    item.myVote === 1 || item.likedByMe ? "#2563EB" : "#374151"
                  }
                />
                <Text style={[styles.footerText, { marginLeft: 4 }]}>
                  {item.upvotes}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.voteHit, { marginLeft: 10 }]}
                onPress={() => onStudyVote(item, -1)}
                disabled={!token}
              >
                <Ionicons
                  name={
                    item.myVote === -1 || item.downvotedByMe
                      ? "chevron-down"
                      : "chevron-down-outline"
                  }
                  size={18}
                  color={
                    item.myVote === -1 || item.downvotedByMe
                      ? "#DC2626"
                      : "#374151"
                  }
                />
                <Text style={[styles.footerText, { marginLeft: 4 }]}>
                  {item.downvotes ?? 0}
                </Text>
              </Pressable>

              <Ionicons
                name="chatbox-outline"
                size={18}
                color="#374151"
                style={{ marginLeft: 12 }}
              />
              <Text style={styles.footerText}>{item.comments}</Text>
            </View>

            <Pressable onPress={() => openComments(item)}>
              <Text style={styles.viewAnswers}>View answers</Text>
            </Pressable>
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
          {FILTERS.map((filter) => {
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

        {error ? <Text style={styles.bannerError}>{error}</Text> : null}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            data={filteredPosts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No threads in this category yet.
              </Text>
            }
          />
        )}

        <Pressable
          style={[styles.addButton, { bottom: insets.bottom + 70 }]}
          onPress={() => {
            setNewCategory(
              selectedCategory !== "All" ? selectedCategory : "Other"
            );
            setComposeOpen(true);
          }}
        >
          <Ionicons name="add" size={28} color="white" />
        </Pressable>
      </SafeAreaView>

      <Modal visible={composeOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: "90%" }]}>
            <Text style={styles.modalTitle}>Ask a question</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Title"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.modalBody}
              placeholder="Details"
              value={newBody}
              onChangeText={setNewBody}
              multiline
            />
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.catPickRow}>
                {categories
                  .filter((c) => c !== "All")
                  .map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setNewCategory(c)}
                      style={[
                        styles.catPick,
                        newCategory === c && styles.catPickOn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catPickText,
                          newCategory === c && styles.catPickTextOn,
                        ]}
                        numberOfLines={1}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  ))}
              </View>
            </ScrollView>
            <View style={styles.modalRow}>
              <Pressable
                style={styles.modalSecondary}
                onPress={() => setComposeOpen(false)}
              >
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalPrimary}
                onPress={submitNewQuestion}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalPrimaryText}>Post</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={commentsOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>Replies</Text>
            {loadingComments ? (
              <ActivityIndicator style={{ marginVertical: 16 }} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(c) => String(c.id)}
                style={{ maxHeight: 280, marginBottom: 8 }}
                renderItem={({ item: c }) => (
                  <View style={styles.commentRow}>
                    <Text style={styles.commentUser}>{c.username}</Text>
                    <Text style={styles.commentBody}>{c.content}</Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No replies yet.</Text>
                }
              />
            )}
            <TextInput
              style={styles.modalInput}
              placeholder="Write a reply…"
              value={commentDraft}
              onChangeText={setCommentDraft}
            />
            <View style={styles.modalRow}>
              <Pressable
                style={styles.modalSecondary}
                onPress={() => setCommentsOpen(false)}
              >
                <Text style={styles.modalSecondaryText}>Close</Text>
              </Pressable>
              <Pressable style={styles.modalPrimary} onPress={submitComment}>
                <Text style={styles.modalPrimaryText}>Send</Text>
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
  iconRow: { flexDirection: "row", gap: 18, alignItems: "center" },
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
  selectedFilterButton: { backgroundColor: "#2563EB" },
  unselectedFilterButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  filterText: { fontSize: 14, fontWeight: "600" },
  selectedFilterText: { color: "white" },
  unselectedFilterText: { color: "#374151" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#D1D5DB" },
  categoryWrapper: { paddingTop: 12, paddingBottom: 4 },
  categoryRow: { paddingHorizontal: 20, gap: 12, paddingBottom: 10 },
  categoryButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCategoryButton: { backgroundColor: "#A855F7" },
  unselectedCategoryButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  categoryText: { fontSize: 14, fontWeight: "600" },
  selectedCategoryText: { color: "white" },
  unselectedCategoryText: { color: "#374151" },
  listContent: { paddingBottom: 180 },
  postCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D1D5DB",
  },
  postHeader: { flexDirection: "row", alignItems: "flex-start" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    backgroundColor: "#E5E7EB",
  },
  postContent: { flex: 1 },
  authorRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  author: { fontSize: 13, fontWeight: "700", color: "#111827" },
  time: { fontSize: 13, color: "#6B7280" },
  question: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
    color: "#111827",
    marginBottom: 12,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  tag: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: { fontSize: 12, color: "#2563EB", fontWeight: "500" },
  answerBox: {
    backgroundColor: "#F9FAFB",
    borderLeftWidth: 3,
    borderLeftColor: "#22C55E",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  answerHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 5 },
  answerBy: { fontSize: 12, fontWeight: "700", color: "#374151" },
  answerText: { fontSize: 13, lineHeight: 19, color: "#374151" },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: { flexDirection: "row", alignItems: "center" },
  voteHit: { flexDirection: "row", alignItems: "center" },
  footerText: { fontSize: 13, color: "#374151", marginLeft: 4 },
  viewAnswers: { fontSize: 13, fontWeight: "600", color: "#2563EB" },
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
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 24 },
  emptyText: { textAlign: "center", color: "#6B7280", marginTop: 24, paddingHorizontal: 24 },
  bannerError: { color: "#DC2626", textAlign: "center", paddingVertical: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#111827" },
  modalInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  modalBody: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  fieldLabel: { fontWeight: "600", marginBottom: 8, color: "#374151" },
  catPickRow: { flexDirection: "row", gap: 8, marginBottom: 12, maxWidth: "100%" },
  catPick: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    maxWidth: 220,
  },
  catPickOn: { backgroundColor: "#A855F7", borderColor: "#A855F7" },
  catPickText: { fontSize: 12, color: "#374151", fontWeight: "600" },
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
  commentRow: {
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8,
  },
  commentUser: { fontWeight: "700", fontSize: 14, color: "#111827" },
  commentBody: { fontSize: 14, color: "#374151", marginTop: 4 },
});
