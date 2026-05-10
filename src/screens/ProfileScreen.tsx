import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FIVE_COLLEGE_OPTIONS } from "@/constants/fiveColleges";
import { useAuth } from "@/context/AuthContext";
import {
  createForumPost,
  followUserByUsername,
  getUserProfileByUsername,
  listMyFeedPostImages,
  listMyImages,
  patchProfile,
  unfollowUserByUsername,
  uploadPostImageMedia,
  uploadProfileAvatar,
  type PublicUser,
} from "@/lib/api";
import { pickImageWithSourceChooser } from "@/lib/pickImage";

const screenWidth = Dimensions.get("window").width;
const imageSize = screenWidth / 3;

function formatStat(n: number | undefined) {
  if (n === undefined || Number.isNaN(n)) return "0";
  return n.toLocaleString();
}

function mergeGalleryImages(
  feed: Array<{ id: string; uri: string }>,
  manual: Array<{ id: string; uri: string }>
): Array<{ id: string; uri: string }> {
  const seen = new Set<string>();
  const out: Array<{ id: string; uri: string }> = [];
  for (const x of feed) {
    const u = x.uri.trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(x);
  }
  for (const x of manual) {
    const u = x.uri.trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(x);
  }
  return out;
}

export default function ProfileScreen({
  profileUsername,
}: {
  profileUsername?: string;
} = {}) {
  const router = useRouter();
  const { user, token, logout, refreshMe, setUser, bumpFeedRevision } = useAuth();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [postImageUploading, setPostImageUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [postImages, setPostImages] = useState<Array<{ uri: string; id: string }>>(
    []
  );
  const [loadingImages, setLoadingImages] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [userSchool, setUserSchool] = useState("");
  const [userMajor, setUserMajor] = useState("");
  const [userYear, setUserYear] = useState("");
  const [userBio, setUserBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [addPhotoOpen, setAddPhotoOpen] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState("");
  const [newPostImageUrl, setNewPostImageUrl] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);

  const isOther = Boolean(
    profileUsername && user && profileUsername !== user.username
  );
  const [otherUser, setOtherUser] = useState<PublicUser | null>(null);
  const [otherFollowing, setOtherFollowing] = useState(false);
  const [loadingOther, setLoadingOther] = useState(false);
  const [otherError, setOtherError] = useState<string | null>(null);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!profileUsername || !user) return;
    if (profileUsername === user.username) {
      router.replace("/(app)/(tabs)/profile");
    }
  }, [profileUsername, user, router]);

  useEffect(() => {
    if (!isOther || !token || !profileUsername) return;
    let cancelled = false;
    (async () => {
      setLoadingOther(true);
      setOtherError(null);
      try {
        const data = await getUserProfileByUsername(token, profileUsername);
        if (!cancelled) {
          setOtherUser(data.user);
          setOtherFollowing(data.isFollowing);
          setPostImages(data.images);
        }
      } catch (e) {
        if (!cancelled) {
          setOtherError(e instanceof Error ? e.message : "Could not load profile");
          setOtherUser(null);
          setPostImages([]);
        }
      } finally {
        if (!cancelled) setLoadingOther(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOther, token, profileUsername]);

  useEffect(() => {
    if (isOther) setActiveTab("posts");
  }, [isOther]);

  const loadImages = useCallback(async () => {
    if (!token || isOther) return;
    setLoadingImages(true);
    try {
      const [feedRes, manualRes] = await Promise.all([
        listMyFeedPostImages(token).catch(() => ({ images: [] as { id: string; uri: string }[] })),
        listMyImages(token).catch(() => ({ images: [] as { id: string; uri: string }[] })),
      ]);
      setPostImages(mergeGalleryImages(feedRes.images, manualRes.images));
    } catch {
      setPostImages([]);
    } finally {
      setLoadingImages(false);
    }
  }, [token, isOther]);

  useEffect(() => {
    if (isOther) return;
    if (activeTab === "posts" && token) {
      loadImages();
    }
  }, [activeTab, token, loadImages, isOther]);

  useFocusEffect(
    useCallback(() => {
      if (!token || isOther) return;
      void refreshMe();
      if (activeTab === "posts") {
        void loadImages();
      }
    }, [activeTab, token, loadImages, refreshMe, isOther])
  );

  const openEdit = () => {
    if (!user) return;
    setFullName(user.full_name ?? "");
    setUserSchool(user.user_school ?? "");
    setUserMajor(user.user_major ?? "");
    setUserYear(user.user_year ?? "");
    setUserBio(user.user_bio ?? "");
    setEditOpen(true);
  };

  const saveProfile = async () => {
    if (!token) return;
    setSavingProfile(true);
    try {
      const { user: next } = await patchProfile(token, {
        fullName: fullName.trim() || null,
        userSchool: userSchool.trim() || null,
        userMajor: userMajor.trim() || null,
        userYear: userYear.trim() || null,
        userBio: userBio.trim() || null,
      });
      setUser(next);
      setEditOpen(false);
      await refreshMe();
    } catch (e) {
      Alert.alert("Could not save", e instanceof Error ? e.message : "Error");
    } finally {
      setSavingProfile(false);
    }
  };

  const openNewPost = () => {
    setNewPostCaption("");
    setNewPostImageUrl("");
    setAddPhotoOpen(true);
  };

  const changeProfilePhoto = async () => {
    if (!token) return;
    const picked = await pickImageWithSourceChooser({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!picked) return;
    setAvatarUploading(true);
    try {
      const { user: next } = await uploadProfileAvatar(
        token,
        picked.uri,
        picked.mimeType ?? "image/jpeg"
      );
      setUser(next);
      await refreshMe();
    } catch (e) {
      Alert.alert(
        "Could not update photo",
        e instanceof Error ? e.message : "Try again."
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  const attachNewPostImage = async () => {
    if (!token) return;
    const picked = await pickImageWithSourceChooser({ quality: 0.88 });
    if (!picked) return;
    setPostImageUploading(true);
    try {
      const { imageUrl } = await uploadPostImageMedia(
        token,
        picked.uri,
        picked.mimeType ?? "image/jpeg"
      );
      setNewPostImageUrl(imageUrl);
    } catch (e) {
      Alert.alert(
        "Could not upload photo",
        e instanceof Error ? e.message : "Try again."
      );
    } finally {
      setPostImageUploading(false);
    }
  };

  const submitNewPostFromProfile = async () => {
    if (!token) return;
    const caption = newPostCaption.trim();
    const imageUrl = newPostImageUrl.trim();
    if (!caption) {
      Alert.alert("Caption required", "Write something to go with your photo.");
      return;
    }
    if (!imageUrl) {
      Alert.alert(
        "Photo required",
        "Choose a photo from your library or camera, or paste an image URL."
      );
      return;
    }
    setSubmittingPost(true);
    try {
      await createForumPost(token, {
        kind: "home",
        category: "Other",
        content: caption,
        imageUrl,
      });
      setNewPostCaption("");
      setNewPostImageUrl("");
      setAddPhotoOpen(false);
      bumpFeedRevision();
      await refreshMe();
      await loadImages();
    } catch (e) {
      Alert.alert(
        "Could not post",
        e instanceof Error ? e.message : "Something went wrong."
      );
    } finally {
      setSubmittingPost(false);
    }
  };

  const onSettings = () => {
    Alert.alert("Account", undefined, [
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          void logout();
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const onShare = async () => {
    const who = isOther ? otherUser : user;
    if (!who) return;
    try {
      await Share.share({
        message: `UMass Connect — @${who.username}`,
      });
    } catch {
      /* ignore */
    }
  };

  const onFollowToggle = async () => {
    if (!token || !profileUsername || !isOther) return;
    setFollowBusy(true);
    try {
      if (otherFollowing) {
        const { user: u, isFollowing } = await unfollowUserByUsername(
          token,
          profileUsername
        );
        setOtherFollowing(isFollowing);
        if (u) setOtherUser(u);
      } else {
        const { user: u, isFollowing } = await followUserByUsername(
          token,
          profileUsername
        );
        setOtherFollowing(isFollowing);
        setOtherUser(u);
      }
      await refreshMe();
    } catch (e) {
      Alert.alert(
        "Could not update follow",
        e instanceof Error ? e.message : "Try again."
      );
    } finally {
      setFollowBusy(false);
    }
  };

  if (!token) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isOther) {
    if (loadingOther) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    if (otherError || !otherUser) {
      return (
        <View style={[styles.centered, { padding: 24 }]}>
          <Text style={{ textAlign: "center", color: "#6B7280" }}>
            {otherError || "User not found."}
          </Text>
        </View>
      );
    }
  }

  if (!user && !isOther) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const displayUser = isOther ? otherUser! : user!;

  const defaultAvatarUri = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayUser.username
  )}&background=E5E7EB&color=111827&size=256`;
  const avatarUri = displayUser.avatar_url?.trim() || defaultAvatarUri;

  const displayName = displayUser.full_name?.trim() || displayUser.username;
  const subtitle = [displayUser.user_school, displayUser.user_major, displayUser.user_year]
    .filter((s) => Boolean(s?.trim()))
    .join(" · ");

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView edges={["top"]} style={styles.safeTop}>
          <View style={styles.headerRow}>
            <Text style={styles.headerHandle}>{displayUser.username}</Text>
            {!isOther ? (
              <View style={styles.headerRight}>
                <Pressable
                  onPress={openNewPost}
                  hitSlop={10}
                  style={styles.headerIconBtn}
                >
                  <Ionicons name="add-circle-outline" size={26} color="#111827" />
                </Pressable>
                <Pressable onPress={onSettings} hitSlop={12}>
                  <Ionicons name="settings-outline" size={24} color="#111827" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.headerRight} />
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.profileRow}>
            <Pressable
              onPress={() => {
                if (!isOther) void changeProfilePhoto();
              }}
              disabled={isOther || avatarUploading || !token}
              style={styles.avatarWrap}
            >
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
              {!isOther && avatarUploading ? (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : !isOther ? (
                <View style={styles.avatarEditBadge} pointerEvents="none">
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              ) : null}
            </Pressable>

            <View style={styles.profileStatsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{formatStat(displayUser.posts)}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{formatStat(displayUser.followers)}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{formatStat(displayUser.following)}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          <View style={styles.nameBlock}>
            <Text style={styles.name}>{displayName}</Text>
            {subtitle ? (
              <Text style={styles.subtitle}>{subtitle}</Text>
            ) : !isOther ? (
              <Text style={styles.subtitleMuted}>
                Tap Edit profile to add school, major, and year
              </Text>
            ) : (
              <Text style={styles.subtitleMuted}>No school or major listed yet.</Text>
            )}
            <Text style={styles.bioInline}>
              {displayUser.user_bio?.trim()
                ? displayUser.user_bio
                : isOther
                  ? "No bio yet."
                  : "Add a bio in Edit profile — clubs, interests, what you're looking for."}
            </Text>
          </View>

          <View style={styles.buttonSection}>
            {isOther ? (
              <View style={styles.buttonRow}>
                <Pressable
                  style={[
                    styles.editProfileBtn,
                    otherFollowing && styles.followBtnFollowing,
                  ]}
                  onPress={() => void onFollowToggle()}
                  disabled={followBusy}
                >
                  {followBusy ? (
                    <ActivityIndicator color={otherFollowing ? "#111827" : "#fff"} />
                  ) : (
                    <Text
                      style={[
                        styles.editProfileBtnText,
                        otherFollowing && styles.followFollowingText,
                      ]}
                    >
                      {otherFollowing ? "Following" : "Follow"}
                    </Text>
                  )}
                </Pressable>
                <Pressable style={styles.shareProfileBtn} onPress={onShare}>
                  <Text style={styles.shareProfileBtnText}>Share Profile</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.buttonRow}>
                <Pressable style={styles.editProfileBtn} onPress={openEdit}>
                  <Text style={styles.editProfileBtnText}>Edit Profile</Text>
                </Pressable>
                <Pressable style={styles.shareProfileBtn} onPress={onShare}>
                  <Text style={styles.shareProfileBtnText}>Share Profile</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.tabSection}>
            <View style={styles.tabRow}>
              <View style={styles.tabHalf}>
                <Pressable
                  style={styles.tabIconOnly}
                  onPress={() => setActiveTab("posts")}
                >
                  <Ionicons
                    name="grid-outline"
                    size={26}
                    color={activeTab === "posts" ? "#2563EB" : "#8E8E8E"}
                  />
                </Pressable>
                <View
                  style={[
                    styles.tabIndicator,
                    activeTab === "posts"
                      ? styles.activeIndicator
                      : styles.inactiveIndicator,
                  ]}
                />
              </View>

              {!isOther ? (
                <View style={styles.tabHalf}>
                  <Pressable
                    style={styles.tabIconOnly}
                    onPress={() => setActiveTab("saved")}
                  >
                    <Ionicons
                      name="bookmark-outline"
                      size={26}
                      color={activeTab === "saved" ? "#2563EB" : "#8E8E8E"}
                    />
                  </Pressable>
                  <View
                    style={[
                      styles.tabIndicator,
                      activeTab === "saved"
                        ? styles.activeIndicator
                        : styles.inactiveIndicator,
                    ]}
                  />
                </View>
              ) : null}
            </View>
          </View>

          {activeTab === "posts" ? (
            !isOther && loadingImages ? (
              <ActivityIndicator style={{ marginVertical: 24 }} />
            ) : postImages.length === 0 ? (
              <Text style={styles.emptyGrid}>
                {isOther
                  ? "No photos yet."
                  : "No photos yet. Tap + to post with a caption and image — it will show here and on Home."}
              </Text>
            ) : (
              <View style={styles.gridWrap}>
                {Array.from({ length: Math.ceil(postImages.length / 3) }).map(
                  (_, rowIndex) => (
                    <View key={rowIndex} style={styles.gridRow}>
                      {postImages
                        .slice(rowIndex * 3, rowIndex * 3 + 3)
                        .map((img) => (
                          <Image
                            key={img.id}
                            source={{ uri: img.uri }}
                            style={[
                              styles.gridImage,
                              { width: imageSize, height: imageSize },
                            ]}
                            contentFit="cover"
                          />
                        ))}
                    </View>
                  )
                )}
              </View>
            )
          ) : (
            <Text style={styles.emptyGrid}>
              Saved posts will appear here when bookmarks are supported.
            </Text>
          )}
        </SafeAreaView>
      </ScrollView>

      <Modal visible={editOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit profile</Text>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
            >
              <Pressable
                style={styles.changePhotoRow}
                onPress={() => void changeProfilePhoto()}
                disabled={avatarUploading || !token}
              >
                <Ionicons name="camera-outline" size={20} color="#2563EB" />
                <Text style={styles.changePhotoText}>
                  {avatarUploading ? "Updating photo…" : "Change profile photo"}
                </Text>
              </Pressable>
              <TextInput
                style={styles.modalInput}
                placeholder="Full name"
                value={fullName}
                onChangeText={setFullName}
              />
              <Text style={styles.modalSectionLabel}>College</Text>
              <Text style={styles.modalHint}>
                Same choices as signup — separate from your bio below.
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modalSchoolRow}
              >
                {FIVE_COLLEGE_OPTIONS.map((school) => {
                  const on = userSchool === school;
                  return (
                    <Pressable
                      key={school}
                      onPress={() => setUserSchool(school)}
                      style={[styles.modalSchoolChip, on && styles.modalSchoolChipOn]}
                    >
                      <Text
                        style={[
                          styles.modalSchoolChipText,
                          on && styles.modalSchoolChipTextOn,
                        ]}
                        numberOfLines={2}
                      >
                        {school}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <TextInput
                style={styles.modalInput}
                placeholder="Major"
                value={userMajor}
                onChangeText={setUserMajor}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Class year (e.g. Junior)"
                value={userYear}
                onChangeText={setUserYear}
              />
              <Text style={styles.modalSectionLabel}>About (bio)</Text>
              <TextInput
                style={styles.modalBody}
                placeholder="Interests, clubs, what you're looking for…"
                value={userBio}
                onChangeText={setUserBio}
                multiline
              />
            </ScrollView>
            <View style={styles.modalRow}>
              <Pressable
                style={styles.modalSecondary}
                onPress={() => setEditOpen(false)}
              >
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalPrimary}
                onPress={saveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalPrimaryText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={addPhotoOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New post</Text>
            <Text style={styles.modalHint}>
              Posts from here go to your profile grid and the Home feed — same as
              Instagram.
            </Text>
            <TextInput
              style={styles.modalInputMultiline}
              placeholder="Write a caption…"
              value={newPostCaption}
              onChangeText={setNewPostCaption}
              multiline
            />
            <Text style={styles.modalSectionLabel}>Photo</Text>
            <View style={styles.composePhotoRow}>
              <Pressable
                style={styles.composePhotoBtn}
                onPress={() => void attachNewPostImage()}
                disabled={postImageUploading || !token}
              >
                {postImageUploading ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.composePhotoBtnText}>Library / camera</Text>
                )}
              </Pressable>
              {newPostImageUrl.trim() ? (
                <Pressable onPress={() => setNewPostImageUrl("")}>
                  <Text style={styles.composeClearPhoto}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
            {newPostImageUrl.trim() ? (
              <Image
                source={{ uri: newPostImageUrl.trim() }}
                style={styles.composePreview}
                contentFit="cover"
              />
            ) : null}
            <TextInput
              style={styles.modalInput}
              placeholder="Or paste image URL (https://…)"
              value={newPostImageUrl}
              onChangeText={setNewPostImageUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={styles.modalRow}>
              <Pressable
                style={styles.modalSecondary}
                onPress={() => setAddPhotoOpen(false)}
              >
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalPrimary}
                onPress={submitNewPostFromProfile}
                disabled={submittingPost}
              >
                {submittingPost ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalPrimaryText}>Share</Text>
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
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  safeTop: { flex: 1, backgroundColor: "#FFFFFF" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerHandle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 16 },
  headerIconBtn: { padding: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#DBDBDB" },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  profileStatsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingLeft: 18,
  },
  avatarWrap: {
    marginRight: 4,
    position: "relative",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#EFEFEF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#DBDBDB",
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(17,24,39,0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  changePhotoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    marginBottom: 8,
  },
  changePhotoText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563EB",
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
    marginBottom: 10,
    backgroundColor: "#F3F4F6",
  },
  stat: { alignItems: "center", minWidth: 72 },
  statNumber: { fontSize: 18, fontWeight: "700", color: "#111827" },
  statLabel: { fontSize: 13, color: "#8E8E8E", marginTop: 2 },
  nameBlock: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  name: { fontSize: 15, fontWeight: "700", color: "#111827" },
  subtitle: {
    fontSize: 14,
    color: "#262626",
    marginTop: 4,
    lineHeight: 20,
  },
  subtitleMuted: {
    fontSize: 14,
    color: "#8E8E8E",
    marginTop: 4,
    lineHeight: 20,
  },
  bioInline: {
    fontSize: 14,
    color: "#262626",
    lineHeight: 20,
    marginTop: 10,
  },
  buttonSection: { paddingHorizontal: 16, paddingTop: 14, marginBottom: 6 },
  buttonRow: { flexDirection: "row", gap: 8 },
  editProfileBtn: {
    flex: 1,
    minHeight: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 8,
  },
  editProfileBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  followBtnFollowing: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  followFollowingText: { color: "#111827" },
  shareProfileBtn: {
    flex: 1,
    minHeight: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DBDBDB",
    paddingVertical: 8,
  },
  shareProfileBtnText: { fontSize: 14, fontWeight: "700", color: "#111827" },
  tabSection: { paddingTop: 4 },
  tabRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#DBDBDB",
  },
  tabHalf: { flex: 1 },
  tabIconOnly: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  tabIndicator: { height: 1 },
  activeIndicator: { backgroundColor: "#2563EB" },
  inactiveIndicator: { backgroundColor: "transparent" },
  gridWrap: { paddingBottom: 24 },
  gridRow: { flexDirection: "row" },
  gridImage: { borderWidth: 0.5, borderColor: "#FFFFFF" },
  emptyGrid: {
    textAlign: "center",
    color: "#6B7280",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    maxHeight: "88%",
  },
  modalScroll: { maxHeight: 420 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#111827" },
  modalSectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
    marginBottom: 4,
  },
  modalHint: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  modalSchoolRow: { flexDirection: "row", gap: 8, marginBottom: 12, paddingVertical: 4 },
  modalSchoolChip: {
    maxWidth: 148,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  modalSchoolChipOn: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  modalSchoolChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  modalSchoolChipTextOn: { color: "#FFFFFF" },
  modalInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
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
  modalBody: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
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
