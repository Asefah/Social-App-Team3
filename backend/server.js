import bcrypt from 'bcrypt';
import express from 'express';
import { loginUser, registerUser } from './auth_logic.js';
import {
  addRSVP,
  createNewEvent,
  deleteExistingEvent,
  getAllEvents,
  getEventDetails,
  getEventsByCategory,
  getEventsByUser,
  removeRSVP,
  updateExistingEvent
} from './event_logic.js';
import {
  createNewPost,
  deleteExistingPost,
  dislikePost,
  getAllPosts,
  getPostByCategory,
  getPostDetails,
  likePost,
  updateExistingPost
} from './forum_logic.js';
import {
  getUserByEmail,
  getUserByUsername,
  updateUserProfile,
  updatePassword,
  getUserFollowersCount,
  getUserFollowingCount
} from './database/models/users_model.js';



const app = express();
const PORT = 5050;
const fallbackEvents = [];
const fallbackPosts = [];

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.post('/login', async (req, res) => {
  try {
    const user = await loginUser(req.body);
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
});

app.post('/register', async (req, res) => {
  try {
    const user = await registerUser(req.body);
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/profile', async (req, res) => {
  const { username } = req.query;

  const user = await getUserByUsername(username);

  if (user) {
    return res.json({ success: true, user });
  }

  return res.status(404).json({ success: false });
});

app.get('/user-by-email', async (req, res) => {
  const { email } = req.query;

  const user = await getUserByEmail(email);

  if (user) {
    return res.json({ success: true, user });
  }

  return res.status(404).json({ success: false });
});

app.put('/update-profile', async (req, res) => {
  const { username, fullName, userSchool, userMajor, userYear, userBio } = req.body;

  const user = await updateUserProfile(
    username,
    fullName,
    userSchool,
    userMajor,
    userYear,
    userBio
  );

  if (user) {
    return res.json({ success: true, user });
  }

  return res.status(400).json({ success: false });
});

app.put('/update-password', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  const existingUser = await getUserByUsername(username);
  if (!existingUser) {
    return res.status(404).json({ success: false });
  }

  const passwordMatches = await bcrypt.compare(
    oldPassword,
    existingUser.hashed_password
  );

  if (!passwordMatches) {
    return res.status(401).json({ success: false });
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  const user = await updatePassword(hashedNewPassword, username);

  if (user) {
    return res.json({ success: true, user });
  }

  return res.status(400).json({ success: false });
});

app.get('/user-followers-count', async (req, res) => {
  const { username } = req.query;

  const count = await getUserFollowersCount(username);

  if (count !== undefined) {
    return res.json({ success: true, count });
  }

  return res.status(404).json({ success: false });
});

app.get('/user-following-count', async (req, res) => {
  const { username } = req.query;

  const count = await getUserFollowingCount(username);

  if (count !== undefined) {
    return res.json({ success: true, count });
  }

  return res.status(404).json({ success: false });
});

app.post('/events', async (req, res) => {
  try {
    const event = await createNewEvent(req.body);
    return res.status(201).json({ success: true, event });
  } catch (error) {
    const event = {
      event_id: `local-${Date.now()}`,
      username: req.body.username,
      event_name: req.body.eventName,
      event_date: req.body.eventDate,
      event_time: req.body.eventTime,
      event_location: req.body.eventLocation,
      category: req.body.category ?? 'Other',
      RSVPs: 0,
      active: true,
    };
    fallbackEvents.unshift(event);
    return res.status(201).json({ success: true, event, fallback: true });
  }
});

app.get('/events', async (req, res) => {
  try {
    const events = await getAllEvents(req.query);
    return res.json({ success: true, events });
  } catch (error) {
    return res.json({ success: true, events: fallbackEvents, fallback: true });
  }
});

app.get('/events/user/:username', async (req, res) => {
  try {
    const events = await getEventsByUser(req.params.username);
    return res.json({ success: true, events });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/events/category/:category', async (req, res) => {
  try {
    const events = await getEventsByCategory(req.params.category);
    return res.json({ success: true, events });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/events/:id', async (req, res) => {
  try {
    const event = await getEventDetails(req.params.id);
    return res.json({ success: true, event });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
});

app.put('/events/:id', async (req, res) => {
  try {
    const event = await updateExistingEvent(
      req.params.id,
      req.body,
      req.body.username
    );
    return res.json({ success: true, event });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/events/:id', async (req, res) => {
  try {
    const result = await deleteExistingEvent(req.params.id, req.body.username);
    return res.json({ success: true, result });
  } catch (error) {
    const index = fallbackEvents.findIndex(
      (event) => String(event.event_id) === String(req.params.id)
    );

    if (index >= 0) {
      fallbackEvents.splice(index, 1);
      return res.json({ success: true, fallback: true });
    }

    return res.status(404).json({ success: false, message: error.message });
  }
});

app.put('/events/:id/rsvp', async (req, res) => {
  try {
    const event = await addRSVP(req.params.id, req.body.username);
    return res.json({ success: true, event });
  } catch (error) {
    const event = fallbackEvents.find(
      (item) => String(item.event_id) === String(req.params.id)
    );

    if (event) {
      event.RSVPs = (event.RSVPs ?? 0) + 1;
      return res.json({ success: true, event, fallback: true });
    }

    return res.status(404).json({ success: false, message: error.message });
  }
});

app.delete('/events/:id/rsvp', async (req, res) => {
  try {
    const event = await removeRSVP(req.params.id, req.body.username);
    return res.json({ success: true, event });
  } catch (error) {
    const event = fallbackEvents.find(
      (item) => String(item.event_id) === String(req.params.id)
    );

    if (event) {
      event.RSVPs = Math.max((event.RSVPs ?? 0) - 1, 0);
      return res.json({ success: true, event, fallback: true });
    }

    return res.status(404).json({ success: false, message: error.message });
  }
});

app.post('/posts', async (req, res) => {
  try {
    const post = await createNewPost(req.body);
    return res.status(201).json({ success: true, post });
  } catch (error) {
    const post = {
      post_id: `local-${Date.now()}`,
      username: req.body.username,
      title: req.body.title ?? 'Campus post',
      category: req.body.category ?? 'Other',
      content: req.body.content,
      likes: 0,
      dislikes: 0,
    };
    fallbackPosts.unshift(post);
    return res.status(201).json({ success: true, post, fallback: true });
  }
});

app.get('/posts', async (req, res) => {
  try {
    const posts = await getAllPosts();
    return res.json({ success: true, posts });
  } catch (error) {
    return res.json({ success: true, posts: fallbackPosts, fallback: true });
  }
});

app.get('/posts/category/:category', async (req, res) => {
  try {
    const posts = await getPostByCategory(req.params.category);
    return res.json({ success: true, posts });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/posts/:id', async (req, res) => {
  try {
    const post = await getPostDetails(req.params.id);
    return res.json({ success: true, post });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
});

app.put('/posts/:id', async (req, res) => {
  try {
    const post = await updateExistingPost(req.params.id, req.body);
    return res.json({ success: true, post });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/posts/:id', async (req, res) => {
  try {
    const post = await deleteExistingPost(req.params.id);
    return res.json({ success: true, post });
  } catch (error) {
    const index = fallbackPosts.findIndex(
      (post) => String(post.post_id) === String(req.params.id)
    );

    if (index >= 0) {
      const [post] = fallbackPosts.splice(index, 1);
      return res.json({ success: true, post, fallback: true });
    }

    return res.status(404).json({ success: false, message: error.message });
  }
});

app.put('/posts/:id/like', async (req, res) => {
  try {
    const post = await likePost(req.params.id);
    return res.json({ success: true, post });
  } catch (error) {
    const post = fallbackPosts.find(
      (item) => String(item.post_id) === String(req.params.id)
    );

    if (post) {
      post.likes = (post.likes ?? 0) + 1;
      return res.json({ success: true, post, fallback: true });
    }

    return res.status(404).json({ success: false, message: error.message });
  }
});

app.put('/posts/:id/dislike', async (req, res) => {
  try {
    const post = await dislikePost(req.params.id);
    return res.json({ success: true, post });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
