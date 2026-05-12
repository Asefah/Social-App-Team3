const API_BASE_URL = "http://localhost:5050";

export type FeedPost = {
  id: string;
  remoteId?: string;
  username: string;
  time: string;
  avatar: string;
  image: string;
  likes: number;
  caption: string;
  comments: number;
};

export type EventItem = {
  id: string;
  username?: string;
  title: string;
  date: string;
  rawDate: string;
  time: string;
  rawTime: string;
  location: string;
  attendance: string;
  rsvps: number;
  category: string;
  image: string;
};

export type CreateEventInput = {
  username: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  category: string;
};

export type CreatePostInput = {
  username: string;
  title: string;
  content: string;
  category?: string;
};

const defaultAvatar =
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200";
const defaultPostImage =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200";
const defaultEventImage =
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200";

const request = async <T>(path: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? "Request failed.");
  }

  return data as T;
};

const formatDate = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const formatTime = (time: string) => {
  if (!time) return "";
  const [hours = "0", minutes = "0"] = time.split(":");
  const parsed = new Date();
  parsed.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

const mapPost = (post: any): FeedPost => ({
  id: String(post.post_id ?? post.forum_post_id ?? post.forum_id),
  remoteId: String(post.post_id ?? post.forum_post_id ?? post.forum_id),
  username: post.username ?? "campus_user",
  time: "Just now",
  avatar: defaultAvatar,
  image: defaultPostImage,
  likes: post.likes ?? 0,
  caption: post.content ?? "",
  comments: 0,
});

const mapEvent = (event: any): EventItem => {
  const rawDate = String(event.event_date ?? event.eventDate ?? "");
  const rawTime = String(event.event_time ?? event.eventTime ?? "");
  const rsvps = event.RSVPs ?? event.rsvps ?? 0;

  return {
    id: String(event.event_id ?? event.id),
    username: event.username,
    title: event.event_name ?? event.eventName ?? event.title,
    date: formatDate(rawDate),
    rawDate,
    time: formatTime(rawTime),
    rawTime,
    location: event.event_location ?? event.eventLocation ?? event.location,
    attendance: `${rsvps} going`,
    rsvps,
    category: event.category ?? "Other",
    image: event.image ?? defaultEventImage,
  };
};

export const api = {
  async getPosts() {
    const data = await request<{ posts?: any[] }>("/posts");
    return (data.posts ?? []).map(mapPost);
  },

  async createPost(input: CreatePostInput) {
    const data = await request<{ post?: any }>("/posts", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapPost(data.post ?? data);
  },

  async likePost(postId: string) {
    const data = await request<{ post?: any }>(`/posts/${postId}/like`, {
      method: "PUT",
    });
    return data.post ? mapPost(data.post) : undefined;
  },

  async getEvents() {
    const data = await request<{ events?: any[] }>("/events");
    return (data.events ?? []).map(mapEvent);
  },

  async createEvent(input: CreateEventInput) {
    const data = await request<{ event?: any }>("/events", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapEvent(data.event);
  },

  async deleteEvent(eventId: string, username?: string) {
    await request(`/events/${eventId}`, {
      method: "DELETE",
      body: JSON.stringify({ username }),
    });
  },

  async addRsvp(eventId: string, username: string) {
    const data = await request<{ event?: any }>(`/events/${eventId}/rsvp`, {
      method: "PUT",
      body: JSON.stringify({ username }),
    });
    return mapEvent(data.event);
  },

  async removeRsvp(eventId: string, username: string) {
    const data = await request<{ event?: any }>(`/events/${eventId}/rsvp`, {
      method: "DELETE",
      body: JSON.stringify({ username }),
    });
    return mapEvent(data.event);
  },
};
