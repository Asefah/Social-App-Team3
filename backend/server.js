import './loadEnv.js';

import cors from 'cors';
import express from 'express';

import {
  loginUser,
  registerUser,
  sanitizePublicUser,
  sanitizeUser,
  signAuthToken,
  verifyAuthToken,
} from './auth_logic.js';
import {
  formatEventRow,
  formatFeedPost,
  formatResourceRow,
  formatStudyPost,
} from './formatters.js';
import { optionalAuth } from './middleware/optionalAuth.js';
import { requireAuth } from './middleware/requireAuth.js';
import {
  ensureUploadsDir,
  publicUploadUrl,
  uploadImage,
  uploadsDir,
} from './middleware/uploadImage.js';
import { createComment, getCommentsByForumPostId } from './database/models/comments_model.js';
import { followUser, isFollowing, unfollowUser } from './database/models/follows_model.js';
import {
  addEventRsvp,
  createEvent,
  getAllActiveEventsForViewer,
  getEventsByCategoryForViewer,
} from './database/models/events_model.js';
import {
  createForumPost,
  getForumPostById,
  listForumCategories,
  listForumPostImagesForUser,
  listForumPosts,
  setForumPostVote,
} from './database/models/forum_posts_model.js';
import { listResources } from './database/models/resources_model.js';
import {
  addImageForUser,
  listImagesForUser,
} from './database/models/user_images_model.js';
import {
  getProfileGridPostCount,
  getUserByUsername,
  getUserByUsernameWithPostCount,
  setUserAvatarUrl,
  updateUserProfile,
} from './database/models/users_model.js';
import { toClientErrorMessage } from './toClientErrorMessage.js';

if (!String(process.env.JWT_SECRET ?? '').trim()) {
  console.error(
    'FATAL: JWT_SECRET is not set. Copy backend/.env.example to backend/.env and set JWT_SECRET (long random string). Without it, sign-up and log-in cannot return tokens.'
  );
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

/** Bearer token → username, or null if missing/invalid (used for optional feed flags). */
function getOptionalAuthUsername(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const rawToken = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAuthToken(rawToken);
    if (typeof payload === 'object' && payload && 'sub' in payload) {
      return String(payload.sub);
    }
  } catch {
    /* ignore */
  }
  return null;
}

function mergePublicGalleryImages(feedRows, manualRows) {
  const seen = new Set();
  const images = [];
  for (const r of feedRows) {
    const uri = String(r.image_url || '').trim();
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    images.push({ id: `post-${r.forum_post_id}`, uri });
  }
  for (const r of manualRows) {
    const uri = String(r.image_url || '').trim();
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    images.push({ id: String(r.image_id), uri });
  }
  return images;
}

ensureUploadsDir();

function handleSingleImage(fieldName) {
  return (req, res, next) => {
    uploadImage.single(fieldName)(req, res, (err) => {
      if (err) {
        const message =
          err instanceof Error ? err.message : 'Could not process upload';
        res.status(400).json({ error: message });
        return;
      }
      next();
    });
  };
}

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/auth/register', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const b = req.body ?? {};
      console.log('[auth/register] attempt', {
        username: b.username,
        email: b.email,
        fullName: b.fullName,
        userSchool: b.userSchool,
        hasPassword: Boolean(b.password)
      });
    }
    const user = await registerUser(req.body);
    let token;
    try {
      token = signAuthToken(user);
    } catch (signErr) {
      const message = toClientErrorMessage(
        signErr,
        'Could not sign session token. Check JWT_SECRET on the server.'
      );
      console.error('[auth/register] token error', signErr);
      res.status(500).json({ error: message });
      return;
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[auth/register] ok', user.username);
    }
    res.status(201).json({ token, user });
  } catch (err) {
    const message = toClientErrorMessage(err, 'Registration failed');
    console.error('[auth/register]', err);
    res.status(400).json({ error: message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const user = await loginUser(req.body);
    let token;
    try {
      token = signAuthToken(user);
    } catch (signErr) {
      const message = toClientErrorMessage(
        signErr,
        'Could not sign session token. Check JWT_SECRET on the server.'
      );
      console.error('[auth/login] token error', signErr);
      res.status(500).json({ error: message });
      return;
    }
    res.json({ token, user });
  } catch (err) {
    const message = toClientErrorMessage(err, 'Login failed');
    console.error('[auth/login]', err);
    res.status(401).json({ error: message });
  }
});

app.get('/auth/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization bearer token' });
    return;
  }
  const rawToken = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAuthToken(rawToken);
    const username =
      typeof payload === 'object' && payload && 'sub' in payload
        ? String(payload.sub)
        : null;
    if (!username) {
      res.status(401).json({ error: 'Invalid token payload' });
      return;
    }
    const row = await getUserByUsernameWithPostCount(username);
    if (!row || row.active === false) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }
    res.json({ user: sanitizeUser(row) });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

app.get('/forum-posts/categories', async (_req, res) => {
  try {
    const categories = await listForumCategories();
    res.json({ categories: ['All', ...categories] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load categories';
    res.status(500).json({ error: message });
  }
});

app.get('/forum-posts', async (req, res) => {
  try {
    const category =
      typeof req.query.category === 'string' ? req.query.category : undefined;
    const kind =
      typeof req.query.kind === 'string' && req.query.kind === 'study'
        ? 'study'
        : 'home';
    const viewer = getOptionalAuthUsername(req);
    const rows = await listForumPosts({
      category,
      postKind: kind,
      viewerUsername: viewer,
    });
    res.json({
      posts: kind === 'home' ? rows.map(formatFeedPost) : [],
      studyPosts: kind === 'study' ? rows.map(formatStudyPost) : [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load posts';
    res.status(500).json({ error: message });
  }
});

app.post('/forum-posts', requireAuth, async (req, res) => {
  try {
    const username = req.authUser.username;
    const { category, title, content, imageUrl, kind } = req.body ?? {};
    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'content is required' });
      return;
    }
    const postKind = kind === 'study' ? 'study' : 'home';
    const row = await createForumPost(username, {
      category: category || 'Other',
      title: title ?? null,
      content: content.trim(),
      imageUrl: imageUrl ?? null,
      postKind,
    });
    const full = await getForumPostById(row.forum_post_id, username);
    res.status(201).json({ post: formatFeedPost(full), studyPost: formatStudyPost(full) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create post';
    res.status(400).json({ error: message });
  }
});

app.post('/forum-posts/:id/vote', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'Invalid post id' });
      return;
    }
    const raw = req.body?.vote;
    const vote = Number(raw);
    if (![0, 1, -1].includes(vote)) {
      res.status(400).json({ error: 'vote must be 1 (up), -1 (down), or 0 (clear)' });
      return;
    }
    const username = req.authUser.username;
    const existing = await getForumPostById(id);
    if (!existing) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    if (vote === -1 && existing.post_kind !== 'study') {
      res.status(400).json({ error: 'Downvotes are only available on study posts.' });
      return;
    }
    await setForumPostVote(id, username, vote);
    const full = await getForumPostById(id, username);
    res.json({ post: formatFeedPost(full), studyPost: formatStudyPost(full) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save vote';
    res.status(400).json({ error: message });
  }
});

app.get('/forum-posts/:id/comments', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'Invalid post id' });
      return;
    }
    const rows = await getCommentsByForumPostId(id);
    res.json({
      comments: rows.map((c) => ({
        id: c.comment_id,
        username: c.username,
        content: c.content,
        likes: c.likes ?? 0,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load comments';
    res.status(500).json({ error: message });
  }
});

app.post('/forum-posts/:id/comments', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'Invalid post id' });
      return;
    }
    const { content } = req.body ?? {};
    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'content is required' });
      return;
    }
    const username = req.authUser.username;
    const row = await createComment(id, username, content.trim());
    res.status(201).json({
      comment: {
        id: row.comment_id,
        username: row.username,
        content: row.content,
        likes: row.likes ?? 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add comment';
    res.status(400).json({ error: message });
  }
});

app.get('/events', optionalAuth, async (req, res) => {
  try {
    const category =
      typeof req.query.category === 'string' ? req.query.category : 'All';
    const viewer = req.authUser?.username ?? null;
    const rows =
      category === 'All'
        ? await getAllActiveEventsForViewer(viewer)
        : await getEventsByCategoryForViewer(category, viewer);
    res.json({ events: rows.map(formatEventRow) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load events';
    res.status(500).json({ error: message });
  }
});

app.post('/events', requireAuth, async (req, res) => {
  try {
    const username = req.authUser.username;
    const {
      eventName,
      eventDate,
      eventTime,
      eventLocation,
      category,
      imageUrl,
    } = req.body ?? {};
    if (
      !eventName ||
      !eventDate ||
      !eventTime ||
      !eventLocation ||
      typeof eventName !== 'string' ||
      typeof eventDate !== 'string' ||
      typeof eventTime !== 'string' ||
      typeof eventLocation !== 'string'
    ) {
      res.status(400).json({
        error:
          'eventName, eventDate (YYYY-MM-DD), eventTime (HH:MM), and eventLocation are required',
      });
      return;
    }
    const row = await createEvent(
      username,
      eventName.trim(),
      eventDate,
      eventTime.length <= 5 ? `${eventTime}:00` : eventTime,
      eventLocation.trim(),
      category || 'Other',
      imageUrl ?? null
    );
    res.status(201).json({ event: formatEventRow(row) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create event';
    res.status(400).json({ error: message });
  }
});

app.post('/events/:id/rsvp', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const username = req.authUser.username;
    const result = await addEventRsvp(id, username);
    if (result.notFound) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    if (result.already) {
      res.status(409).json({
        error: 'You have already RSVPed to this event',
        event: formatEventRow({ ...result.event, user_has_rsvp: true }),
      });
      return;
    }
    res.json({
      event: formatEventRow({ ...result.event, user_has_rsvp: true }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to RSVP';
    res.status(400).json({ error: message });
  }
});

app.get('/resources', async (req, res) => {
  try {
    const category =
      typeof req.query.category === 'string' ? req.query.category : 'All';
    const rows = await listResources({ category });
    const unique = Array.from(
      new Set(rows.map((r) => r.category).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    const categories = ['All', ...unique];
    res.json({
      categories,
      resources: rows.map(formatResourceRow),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load resources';
    res.status(500).json({ error: message });
  }
});

app.post(
  '/users/me/media',
  requireAuth,
  handleSingleImage('photo'),
  async (req, res) => {
    try {
      if (!req.file?.filename) {
        res.status(400).json({ error: 'Missing image file (multipart field "photo")' });
        return;
      }
      const imageUrl = publicUploadUrl(req, req.file.filename);
      res.status(201).json({ imageUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      res.status(500).json({ error: message });
    }
  }
);

app.post(
  '/users/me/avatar',
  requireAuth,
  handleSingleImage('photo'),
  async (req, res) => {
    try {
      if (!req.file?.filename) {
        res.status(400).json({ error: 'Missing image file (multipart field "photo")' });
        return;
      }
      const username = req.authUser.username;
      const url = publicUploadUrl(req, req.file.filename);
      await setUserAvatarUrl(username, url);
      const refreshed = await getUserByUsernameWithPostCount(username);
      if (!refreshed) {
        res.status(500).json({ error: 'Failed to load profile' });
        return;
      }
      res.json({ user: sanitizeUser(refreshed) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      res.status(500).json({ error: message });
    }
  }
);

app.patch('/users/me', requireAuth, async (req, res) => {
  try {
    const u = req.authUser;
    const username = u.username;
    const { fullName, userSchool, userMajor, userYear, userBio } = req.body ?? {};
    const pick = (bodyVal, column) => {
      if (bodyVal === undefined) return u[column];
      if (bodyVal === null || bodyVal === '') return null;
      return String(bodyVal);
    };
    await updateUserProfile(
      username,
      pick(fullName, 'full_name'),
      pick(userSchool, 'user_school'),
      pick(userMajor, 'user_major'),
      pick(userYear, 'user_year'),
      pick(userBio, 'user_bio')
    );
    const refreshed = await getUserByUsernameWithPostCount(username);
    if (!refreshed) {
      res.status(500).json({ error: 'Failed to load profile' });
      return;
    }
    res.json({ user: sanitizeUser(refreshed) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    res.status(400).json({ error: message });
  }
});

app.get('/users/by/:username', requireAuth, async (req, res) => {
  try {
    const target = String(req.params.username || '').trim();
    if (!target) {
      res.status(400).json({ error: 'username is required' });
      return;
    }
    const viewer = req.authUser.username;
    const row = await getUserByUsername(target);
    if (!row || row.active === false) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const posts = await getProfileGridPostCount(target);
    const following = await isFollowing(viewer, target);
    const [feedRows, manualRows] = await Promise.all([
      listForumPostImagesForUser(target),
      listImagesForUser(target),
    ]);
    const images = mergePublicGalleryImages(feedRows, manualRows);
    res.json({
      user: sanitizePublicUser({ ...row, posts }),
      images,
      isFollowing: following,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load profile';
    res.status(500).json({ error: message });
  }
});

app.post('/users/by/:username/follow', requireAuth, async (req, res) => {
  try {
    const target = String(req.params.username || '').trim();
    const viewer = req.authUser.username;
    if (!target) {
      res.status(400).json({ error: 'username is required' });
      return;
    }
    if (target === viewer) {
      res.status(400).json({ error: 'You cannot follow yourself.' });
      return;
    }
    const row = await getUserByUsername(target);
    if (!row || row.active === false) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    await followUser(viewer, target);
    const targetWithPosts = await getUserByUsernameWithPostCount(target);
    res.json({
      isFollowing: true,
      user: sanitizePublicUser(targetWithPosts ?? { ...row, posts: await getProfileGridPostCount(target) }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to follow';
    res.status(400).json({ error: message });
  }
});

app.delete('/users/by/:username/follow', requireAuth, async (req, res) => {
  try {
    const target = String(req.params.username || '').trim();
    const viewer = req.authUser.username;
    if (!target) {
      res.status(400).json({ error: 'username is required' });
      return;
    }
    await unfollowUser(viewer, target);
    const row = await getUserByUsername(target);
    const posts = row ? await getProfileGridPostCount(target) : 0;
    res.json({
      isFollowing: false,
      user: row && row.active !== false ? sanitizePublicUser({ ...row, posts }) : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to unfollow';
    res.status(400).json({ error: message });
  }
});

app.get('/users/me/feed-post-images', requireAuth, async (req, res) => {
  try {
    const username = req.authUser.username;
    const rows = await listForumPostImagesForUser(username);
    res.json({
      images: rows.map((r) => ({
        id: `post-${r.forum_post_id}`,
        uri: r.image_url,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load feed images';
    res.status(500).json({ error: message });
  }
});

app.get('/users/me/images', requireAuth, async (req, res) => {
  try {
    const username = req.authUser.username;
    const rows = await listImagesForUser(username);
    res.json({ images: rows.map((r) => ({ uri: r.image_url, id: String(r.image_id) })) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load images';
    res.status(500).json({ error: message });
  }
});

app.post('/users/me/images', requireAuth, async (req, res) => {
  try {
    const username = req.authUser.username;
    const { imageUrl } = req.body ?? {};
    if (!imageUrl || typeof imageUrl !== 'string') {
      res.status(400).json({ error: 'imageUrl is required' });
      return;
    }
    const row = await addImageForUser(username, imageUrl.trim());
    res.status(201).json({ image: { uri: row.image_url, id: String(row.image_id) } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add image';
    res.status(400).json({ error: message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});
