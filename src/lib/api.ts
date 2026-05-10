import Constants from "expo-constants";

export type AuthUser = {
  username: string;
  email: string;
  full_name: string | null;
  user_school: string | null;
  user_major: string | null;
  user_year: string | null;
  user_bio: string | null;
  /** Set after uploading a profile photo; shown on profile and in feeds. */
  avatar_url?: string | null;
  created_at?: string;
  active?: boolean;
  posts?: number;
  followers?: number;
  following?: number;
};

/** Another member's profile (no email). */
export type PublicUser = {
  username: string;
  full_name: string | null;
  user_school: string | null;
  user_major: string | null;
  user_year: string | null;
  user_bio: string | null;
  avatar_url?: string | null;
  created_at?: string;
  active?: boolean;
  posts?: number;
  followers?: number;
  following?: number;
};

export type FeedPost = {
  id: string;
  forumPostId: number;
  username: string;
  avatar: string;
  time: string;
  image: string;
  likes: number;
  /** Current user's vote: 1 = liked, 0 = none (when logged in with token on feed). */
  myVote?: 0 | 1;
  /** @deprecated use myVote === 1 */
  likedByMe?: boolean;
  caption: string;
  comments: number;
  category?: string;
};

export type StudyPostApi = {
  id: string;
  forumPostId: number;
  author: string;
  time: string;
  category: string;
  title: string;
  tags: string[];
  topAnswerBy: string;
  answer: string;
  upvotes: number;
  downvotes: number;
  /** 1 = up, -1 = down, 0 = none (with auth on feed). */
  myVote?: -1 | 0 | 1;
  /** @deprecated use myVote === 1 */
  likedByMe?: boolean;
  /** @deprecated use myVote === -1 */
  downvotedByMe?: boolean;
  comments: number;
  avatar: string;
};

export type EventApi = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendance: string;
  category: string;
  image: string;
  /** Present when listing or after RSVP with auth; true if the current user already RSVPed. */
  hasRsvped?: boolean;
};

export type ResourceApi = {
  id: string;
  title: string;
  description: string;
  hours: string;
  isOpen: boolean;
  category: string;
  image: string;
  link: string;
};

export type CommentApi = {
  id: number;
  username: string;
  content: string;
  likes: number;
};

/** Resolved API origin (env `EXPO_PUBLIC_API_URL`, then `expo.extra.apiUrl`, else localhost). */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  if (extra?.apiUrl) return String(extra.apiUrl).replace(/\/$/, "");

  return "http://localhost:3000";
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

function messageFromErrorResponse(body: unknown, status: number): string {
  if (typeof body === "object" && body !== null && "error" in body) {
    const e = (body as { error: unknown }).error;
    if (typeof e === "string" && e.trim()) return e;
    if (typeof e === "string" && !e.trim()) {
      return `Server returned an empty error (HTTP ${status}). Check the API terminal, database config, or try Log in if you already registered.`;
    }
  }
  if (typeof body === "object" && body !== null && "message" in body) {
    const m = (body as { message: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  if (typeof body === "object" && body !== null) {
    try {
      const s = JSON.stringify(body);
      if (s !== "{}" && s !== '{"error":""}' && s.length < 400) return s;
    } catch {
      /* ignore */
    }
  }
  return `Request failed (${status})`;
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const API_TIMEOUT_MS = 20_000;

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const mergedHeaders: HeadersInit = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  if (token) {
    (mergedHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: mergedHeaders,
      signal: controller.signal,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (err.name === "AbortError") {
      throw new ApiError(
        "Could not reach the server in time. Start the API (npm run api) and, on a phone, set EXPO_PUBLIC_API_URL to your computer's address (not localhost).",
        0,
        {}
      );
    }
    throw new ApiError(
      err.message || "Network error. Check your connection.",
      0,
      {}
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const body = await parseJson(res);

  if (!res.ok) {
    const msg = messageFromErrorResponse(body, res.status);
    throw new ApiError(msg, res.status, body);
  }

  return body as T;
}

export async function loginRequest(
  email: string,
  password: string
): Promise<{ token: string; user: AuthUser }> {
  return apiRequest("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function registerRequest(payload: {
  username: string;
  email: string;
  password: string;
  fullName: string;
  userSchool: string;
  userMajor: string;
  userYear: string;
}): Promise<{ token: string; user: AuthUser }> {
  return apiRequest("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function meRequest(
  token: string
): Promise<{ user: AuthUser }> {
  return apiRequest("/auth/me", {
    method: "GET",
    token,
  });
}

export async function forumPostCategories(
  token: string | null
): Promise<{ categories: string[] }> {
  return apiRequest("/forum-posts/categories", {
    method: "GET",
    token: token ?? undefined,
  });
}

export async function listForumPosts(
  token: string | null,
  opts?: { category?: string; kind?: "home" | "study" }
): Promise<{ posts: FeedPost[]; studyPosts: StudyPostApi[] }> {
  const qs = new URLSearchParams();
  qs.set("kind", opts?.kind ?? "home");
  if (opts?.category && opts.category !== "All") {
    qs.set("category", opts.category);
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiRequest(`/forum-posts${suffix}`, {
    method: "GET",
    token: token ?? undefined,
  });
}

export async function createForumPost(
  token: string,
  body: {
    category?: string;
    title?: string | null;
    content: string;
    imageUrl?: string | null;
    /** `home` = social feed; `study` = Study tab only (default `home`). */
    kind?: "home" | "study";
  }
): Promise<{ post: FeedPost; studyPost: StudyPostApi }> {
  return apiRequest("/forum-posts", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function setForumPostVote(
  token: string,
  forumPostId: number,
  vote: 1 | -1 | 0
): Promise<{ post: FeedPost; studyPost: StudyPostApi }> {
  return apiRequest(`/forum-posts/${forumPostId}/vote`, {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vote }),
  });
}

export async function listComments(
  forumPostId: number
): Promise<{ comments: CommentApi[] }> {
  return apiRequest(`/forum-posts/${forumPostId}/comments`, {
    method: "GET",
  });
}

export async function addComment(
  token: string,
  forumPostId: number,
  content: string
): Promise<{ comment: CommentApi }> {
  return apiRequest(`/forum-posts/${forumPostId}/comments`, {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export async function listEvents(
  token: string | null,
  category?: string
): Promise<{ events: EventApi[] }> {
  const qs = new URLSearchParams();
  if (category && category !== "All") qs.set("category", category);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiRequest(`/events${suffix}`, {
    method: "GET",
    token: token ?? undefined,
  });
}

export async function createEvent(
  token: string,
  body: {
    eventName: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    category?: string;
    imageUrl?: string | null;
  }
): Promise<{ event: EventApi }> {
  return apiRequest("/events", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function rsvpEvent(
  token: string,
  eventId: string
): Promise<{ event: EventApi }> {
  return apiRequest(`/events/${eventId}/rsvp`, {
    method: "POST",
    token,
  });
}

export async function listResources(
  token: string | null,
  category?: string
): Promise<{ categories: string[]; resources: ResourceApi[] }> {
  const qs = new URLSearchParams();
  if (category && category !== "All") qs.set("category", category);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiRequest(`/resources${suffix}`, {
    method: "GET",
    token: token ?? undefined,
  });
}

export async function patchProfile(
  token: string,
  body: {
    fullName?: string | null;
    userSchool?: string | null;
    userMajor?: string | null;
    userYear?: string | null;
    userBio?: string | null;
  }
): Promise<{ user: AuthUser }> {
  return apiRequest("/users/me", {
    method: "PATCH",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: body.fullName,
      userSchool: body.userSchool,
      userMajor: body.userMajor,
      userYear: body.userYear,
      userBio: body.userBio,
    }),
  });
}

export async function getUserProfileByUsername(
  token: string,
  username: string
): Promise<{
  user: PublicUser;
  images: Array<{ id: string; uri: string }>;
  isFollowing: boolean;
}> {
  return apiRequest(`/users/by/${encodeURIComponent(username)}`, {
    method: "GET",
    token,
  });
}

export async function followUserByUsername(
  token: string,
  username: string
): Promise<{ isFollowing: boolean; user: PublicUser }> {
  return apiRequest(`/users/by/${encodeURIComponent(username)}/follow`, {
    method: "POST",
    token,
  });
}

export async function unfollowUserByUsername(
  token: string,
  username: string
): Promise<{ isFollowing: boolean; user: PublicUser | null }> {
  return apiRequest(`/users/by/${encodeURIComponent(username)}/follow`, {
    method: "DELETE",
    token,
  });
}

/** Images from your Home feed posts (forum_posts with image_url). */
export async function listMyFeedPostImages(
  token: string
): Promise<{ images: Array<{ uri: string; id: string }> }> {
  return apiRequest("/users/me/feed-post-images", {
    method: "GET",
    token,
  });
}

export async function listMyImages(
  token: string
): Promise<{ images: Array<{ uri: string; id: string }> }> {
  return apiRequest("/users/me/images", {
    method: "GET",
    token,
  });
}

export async function addMyImage(
  token: string,
  imageUrl: string
): Promise<{ image: { uri: string; id: string } }> {
  return apiRequest("/users/me/images", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });
}

/** Upload a picked image for a post; returns a URL your API can store on `forum_posts.image_url`. */
export async function uploadPostImageMedia(
  token: string,
  localUri: string,
  mimeType = "image/jpeg"
): Promise<{ imageUrl: string }> {
  const form = new FormData();
  form.append("photo", {
    uri: localUri,
    name: "photo.jpg",
    type: mimeType,
  } as unknown as Blob);
  const url = `${getApiBaseUrl()}/users/me/media`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
  const body = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(messageFromErrorResponse(body, res.status), res.status, body);
  }
  return body as { imageUrl: string };
}

/** Upload and save profile photo; returns updated user. */
export async function uploadProfileAvatar(
  token: string,
  localUri: string,
  mimeType = "image/jpeg"
): Promise<{ user: AuthUser }> {
  const form = new FormData();
  form.append("photo", {
    uri: localUri,
    name: "avatar.jpg",
    type: mimeType,
  } as unknown as Blob);
  const url = `${getApiBaseUrl()}/users/me/avatar`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
  const body = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(messageFromErrorResponse(body, res.status), res.status, body);
  }
  return body as { user: AuthUser };
}
