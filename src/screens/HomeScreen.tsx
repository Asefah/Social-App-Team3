import Ionicons from "@expo/vector-icons/Ionicons";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import {
  addComment,
  createForumPost,
  listComments,
  listForumPosts,
  setForumPostVote,
  uploadPostImageMedia,
  type CommentApi,
  type FeedPost,
} from "@/lib/api";
import { pickImageWithSourceChooser } from "@/lib/pickImage";

const { width: SCREEN_W } = Dimensions.get("window");
const FEED_IMAGE_SIZE = SCREEN_W;

export default function HomeScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { token, user, feedRevision, refreshMe } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCompletedInitialLoad = useRef(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [composeImageUploading, setComposeImageUploading] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [activePost, setActivePost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<CommentApi[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const { posts: next } = await listForumPosts(token, { kind: "home" });
    setPosts(next);
  }, [token]);

  // NativeTabs often does not emit expo-router focus events; useIsFocused
  // refetches whenever the Home tab becomes active (e.g. after posting from Profile).
  useEffect(() => {
    if (!isFocused) return;
    let cancelled = false;
    (async () => {
      if (!hasCompletedInitialLoad.current) {
        setLoading(true);
      }
      try {
        await load();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load feed");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          hasCompletedInitialLoad.current = true;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isFocused, load]);

  // Refetch when a post is created from Profile (or anywhere that bumps revision),
  // even if this tab stays mounted but unfocused under NativeTabs.
  useEffect(() => {
    if (feedRevision === 0) return;
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not refresh feed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [feedRevision, load]);

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

  const openComments = async (item: FeedPost) => {
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
      setPosts((prev) =>
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

  const onLike = async (item: FeedPost) => {
    if (!token) return;
    const current = item.myVote === 1 || item.likedByMe ? 1 : 0;
    const nextVote = current === 1 ? 0 : 1;
    try {
      const { post } = await setForumPostVote(token, item.forumPostId, nextVote);
      setPosts((prev) =>
        prev.map((p) => (p.forumPostId === post.forumPostId ? post : p))
      );
    } catch {
      /* ignore */
    }
  };

  const attachComposeImage = async () => {
    if (!token) return;
    const picked = await pickImageWithSourceChooser({ quality: 0.88 });
    if (!picked) return;
    setComposeImageUploading(true);
    try {
      const { imageUrl: url } = await uploadPostImageMedia(
        token,
        picked.uri,
        picked.mimeType ?? "image/jpeg"
      );
      setImageUrl(url);
    } catch (e) {
      Alert.alert(
        "Could not upload photo",
        e instanceof Error ? e.message : "Try again."
      );
    } finally {
      setComposeImageUploading(false);
    }
  };

  const submitNewPost = async () => {
    if (!token || !caption.trim()) return;
    setSubmittingPost(true);
    try {
      await createForumPost(token, {
        kind: "home",
        category: "Other",
        content: caption.trim(),
        imageUrl: imageUrl.trim() || null,
      });
      setCaption("");
      setImageUrl("");
      setComposeOpen(false);
      await load();
      await refreshMe();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post");
    } finally {
      setSubmittingPost(false);
    }
  };

  const goToUserProfile = (username: string) => {
    if (user?.username === username) {
      router.push("/(app)/(tabs)/profile");
    } else {
      router.push(`/(app)/user/${encodeURIComponent(username)}`);
    }
  };

  const renderPost = ({ item }: { item: FeedPost }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <Pressable
            onPress={() => goToUserProfile(item.username)}
            hitSlop={6}
          >
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          </Pressable>
          <Pressable
            style={styles.postHeaderTitles}
            onPress={() => goToUserProfile(item.username)}
            hitSlop={4}
          >
            <Text style={styles.usernameRow}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.usernameMuted}> · {item.time}</Text>
            </Text>
          </Pressable>
        </View>
        <Pressable hitSlop={10} style={styles.postMenuHit}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#111827" />
        </Pressable>
      </View>

      <Image
        source={{ uri: item.image }}
        style={styles.postImage}
        contentFit="cover"
      />

      <View style={styles.postActions}>
        <Pressable
          onPress={() => onLike(item)}
          hitSlop={10}
          style={styles.actionHit}
          disabled={!token}
        >
          <Ionicons
            name={item.myVote === 1 || item.likedByMe ? "heart" : "heart-outline"}
            size={28}
            color={
              item.myVote === 1 || item.likedByMe ? "#EF4444" : "#111827"
            }
          />
        </Pressable>
        <Pressable onPress={() => openComments(item)} hitSlop={10} style={styles.actionHit}>
          <Ionicons name="chatbubble-outline" size={26} color="#111827" />
        </Pressable>
        <Pressable hitSlop={10} style={styles.actionHit}>
          <Ionicons name="paper-plane-outline" size={25} color="#111827" />
        </Pressable>
      </View>

      <View style={styles.captionSection}>
        <Text style={styles.likes}>
          {item.likes.toLocaleString()}{" "}
          {item.likes === 1 ? "like" : "likes"}
        </Text>

        <Text style={styles.caption}>
          <Text
            style={styles.captionUsername}
            onPress={() => goToUserProfile(item.username)}
          >
            {item.username}
          </Text>{" "}
          {item.caption}
        </Text>

        <Pressable onPress={() => openComments(item)}>
          <Text style={styles.comments}>
            {item.comments === 0
              ? "Add a comment…"
              : `View all ${item.comments} comments`}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeTop}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>UMass Connect</Text>

          <View style={styles.iconRow}>
            <Ionicons name="search-outline" size={26} color="#111827" />
            <Ionicons name="notifications-outline" size={26} color="#111827" />
            <Pressable onPress={() => setComposeOpen(true)} hitSlop={8}>
              <Ionicons name="add-circle-outline" size={28} color="#2563EB" />
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        {error ? <Text style={styles.bannerError}>{error}</Text> : null}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            data={posts}
            extraData={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No posts yet. Tap + to share something.
              </Text>
            }
          />
        )}
      </SafeAreaView>

      <Modal visible={composeOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New post</Text>
            <TextInput
              style={styles.modalInputMultiline}
              placeholder="Write a caption…"
              value={caption}
              onChangeText={setCaption}
              multiline
            />
            <Text style={styles.modalSectionLabel}>Photo</Text>
            <View style={styles.composePhotoRow}>
              <Pressable
                style={styles.composePhotoBtn}
                onPress={() => void attachComposeImage()}
                disabled={composeImageUploading || !token}
              >
                {composeImageUploading ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.composePhotoBtnText}>Library / camera</Text>
                )}
              </Pressable>
              {imageUrl.trim() ? (
                <Pressable onPress={() => setImageUrl("")}>
                  <Text style={styles.composeClearPhoto}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
            {imageUrl.trim() ? (
              <Image
                source={{ uri: imageUrl.trim() }}
                style={styles.composePreview}
                contentFit="cover"
              />
            ) : null}
            <TextInput
              style={styles.modalInput}
              placeholder="Or paste image URL (optional)"
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
            />
            <View style={styles.modalRow}>
              <Pressable
                style={styles.modalSecondary}
                onPress={() => setComposeOpen(false)}
              >
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalPrimary}
                onPress={submitNewPost}
                disabled={submittingPost}
              >
                {submittingPost ? (
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
          <View style={[styles.modalCard, styles.commentsCard]}>
            <Text style={styles.modalTitle}>
              Comments{activePost ? ` · @${activePost.username}` : ""}
            </Text>
            {loadingComments ? (
              <ActivityIndicator style={{ marginVertical: 16 }} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(c) => String(c.id)}
                style={styles.commentsList}
                renderItem={({ item: c }) => (
                  <View style={styles.commentRow}>
                    <Text style={styles.commentUser}>{c.username}</Text>
                    <Text style={styles.commentBody}>{c.content}</Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No comments yet.</Text>
                }
              />
            )}
            <TextInput
              style={styles.modalInput}
              placeholder="Add a comment…"
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D1D5DB",
  },
  listContent: {
    paddingBottom: 180,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DBDBDB",
    marginBottom: 8,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  postHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  postHeaderTitles: {
    flexShrink: 1,
    flex: 1,
    justifyContent: "center",
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
  },
  postMenuHit: {
    padding: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: "#E5E7EB",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#DBDBDB",
  },
  username: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  usernameMuted: {
    fontSize: 13,
    fontWeight: "400",
    color: "#8E8E8E",
  },
  postImage: {
    width: FEED_IMAGE_SIZE,
    height: FEED_IMAGE_SIZE,
    backgroundColor: "#EFEFEF",
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  actionHit: {
    paddingVertical: 2,
  },
  captionSection: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  likes: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  caption: {
    fontSize: 14,
    lineHeight: 19,
    color: "#111827",
    marginBottom: 4,
  },
  captionUsername: {
    fontWeight: "700",
  },
  comments: {
    fontSize: 13,
    color: "#8E8E8E",
    marginTop: 2,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 32,
    paddingHorizontal: 24,
  },
  bannerError: {
    color: "#DC2626",
    textAlign: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  commentsCard: {
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },
  modalSectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  composePhotoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
  },
  composePhotoBtn: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 140,
    alignItems: "center",
  },
  composePhotoBtnText: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 14,
  },
  composeClearPhoto: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 14,
  },
  composePreview: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#F3F4F6",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalInputMultiline: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  modalPrimary: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  modalPrimaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  modalSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  modalSecondaryText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 16,
  },
  commentsList: {
    maxHeight: 280,
    marginBottom: 8,
  },
  commentRow: {
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8,
  },
  commentUser: {
    fontWeight: "700",
    fontSize: 14,
    color: "#111827",
  },
  commentBody: {
    fontSize: 14,
    color: "#374151",
    marginTop: 4,
  },
});
