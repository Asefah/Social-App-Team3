/*import * as Device from 'expo-device';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

function getDevMenuHint() {
  if (Platform.OS === 'web') {
    return <ThemedText type="small">use browser devtools</ThemedText>;
  }
  if (Device.isDevice) {
    return (
      <ThemedText type="small">
        shake device or press <ThemedText type="code">m</ThemedText> in terminal
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <ThemedText type="small">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type="title" style={styles.title}>
            Welcome to&nbsp;Expo
          </ThemedText>
        </ThemedView>

        <ThemedText type="code" style={styles.code}>
          get started
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.stepContainer}>
          <HintRow
            title="Try editing"
            hint={<ThemedText type="code">src/app/index.tsx</ThemedText>}
          />
          <HintRow title="Dev tools" hint={getDevMenuHint()} />
          <HintRow
            title="Fresh start"
            hint={<ThemedText type="code">npm run reset-project</ThemedText>}
          />
        </ThemedView>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
});*/

import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { feedPosts } from "../constants/homeData";
import { api, FeedPost } from "../services/api";

const DEMO_USERNAME = "demo_user";

export default function HomeScreen() {
  const [posts, setPosts] = useState<FeedPost[]>(feedPosts);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [draftPost, setDraftPost] = useState("");
  const [apiStatus, setApiStatus] = useState("Using saved sample feed");

  useEffect(() => {
    api
      .getPosts()
      .then((backendPosts) => {
        if (backendPosts.length > 0) {
          setPosts(backendPosts);
          setApiStatus("Connected to backend posts");
        }
      })
      .catch(() => setApiStatus("Backend offline: using sample feed"));
  }, []);

  const submitPost = async () => {
    const content = draftPost.trim();
    if (!content) return;

    const optimisticPost: FeedPost = {
      id: `local-${Date.now()}`,
      username: DEMO_USERNAME,
      time: "Just now",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200",
      likes: 0,
      caption: content,
      comments: 0,
    };

    setDraftPost("");
    setPosts((current) => [optimisticPost, ...current]);

    try {
      const savedPost = await api.createPost({
        username: DEMO_USERNAME,
        title: "Campus post",
        content,
      });

      setPosts((current) =>
        current.map((post) =>
          post.id === optimisticPost.id ? savedPost : post
        )
      );
      setApiStatus("Post saved to backend");
    } catch {
      setApiStatus("Backend offline: post added locally");
    }
  };

  const toggleLike = async (post: FeedPost) => {
    const postId = post.id;
    setLikedPosts((current) => ({
      ...current,
      [postId]: !current[postId],
    }));

    if (!post.remoteId || likedPosts[postId]) return;

    try {
      const updatedPost = await api.likePost(post.remoteId);
      if (updatedPost) {
        setPosts((current) =>
          current.map((item) => (item.id === postId ? updatedPost : item))
        );
      }
    } catch {
      setApiStatus("Backend offline: like saved locally");
    }
  };

  const renderPost = ({ item }: { item: FeedPost }) => {
    const isLiked = likedPosts[item.id];
    const likeCount = item.likes + (isLiked ? 1 : 0);

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />

          <View>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        </View>

        <Image
          source={{ uri: item.image }}
          style={styles.postImage}
          contentFit="cover"
        />

        <View style={styles.postActions}>
          <Pressable
            onPress={() => toggleLike(item)}
            accessibilityRole="button"
            accessibilityLabel={`${isLiked ? "Unlike" : "Like"} ${item.username}'s post`}
            style={styles.actionButton}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={26}
              color={isLiked ? "#DC2626" : "#111827"}
            />
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={25} color="#111827" />
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.actionButton}>
            <Ionicons name="share-outline" size={25} color="#111827" />
          </Pressable>
        </View>

        <View style={styles.captionSection}>
          <Text style={styles.likes}>{likeCount} likes</Text>

          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>{item.username}</Text>{" "}
            {item.caption}
          </Text>

          <Text style={styles.comments}>View all {item.comments} comments</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeTop}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>HiveFive</Text>

          <View style={styles.iconRow}>
            <Ionicons name="search-outline" size={25} color="#111827" />
            <Ionicons name="notifications-outline" size={24} color="#111827" />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.composer}>
          <TextInput
            value={draftPost}
            onChangeText={setDraftPost}
            placeholder="Share something with campus..."
            style={styles.composerInput}
            multiline
          />
          <Pressable
            onPress={submitPost}
            accessibilityRole="button"
            style={[
              styles.postButton,
              !draftPost.trim() && styles.postButtonDisabled,
            ]}
          >
            <Ionicons name="send" size={18} color="white" />
            <Text style={styles.postButtonText}>Post</Text>
          </Pressable>
          <Text style={styles.apiStatus}>{apiStatus}</Text>
        </View>

        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },

  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D1D5DB",
  },

  listContent: {
    paddingBottom: 180,
  },

  composer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    gap: 10,
  },

  composerInput: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#F9FAFB",
    textAlignVertical: "top",
  },

  postButton: {
    height: 42,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  postButtonDisabled: {
    opacity: 0.5,
  },

  postButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },

  apiStatus: {
    color: "#6B7280",
    fontSize: 12,
  },

  postCard: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },

  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
    backgroundColor: "#E5E7EB",
  },

  username: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  time: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 3,
  },

  postImage: {
    width: "100%",
    height: 560,
    backgroundColor: "#E5E7EB",
  },

  postActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  actionButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  captionSection: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },

  likes: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: "#111827",
    marginBottom: 6,
  },

  captionUsername: {
    fontWeight: "700",
  },

  comments: {
    fontSize: 14,
    color: "#6B7280",
  },
});
