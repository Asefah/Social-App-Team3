import {
  createForum,
  deleteForum,
  dislikeForum,
  getForumByForumId,
  getForumsByCategory,
  getForumsPosts,
  likeForum,
  updateForum,
} from './database/models/forums_model.js';

const MAX_POST_LENGTH = 5000;

const isValidPostContent = (content) => {
  if (!content || typeof content !== 'string') return false;

  const trimmed = content.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > MAX_POST_LENGTH) return false;

  return true;
};

const sanitizePost = (post) => ({
  post_id: post.forum_post_id ?? post.forum_id,
  username: post.username,
  category: post.category,
  title: post.title ?? 'Campus post',
  content: post.content,
  likes: post.likes ?? 0,
  dislikes: post.dislikes ?? 0,
  edited_at: post.edited_at,
});

export const createNewPost = async (...args) => {
  const payload =
    args.length === 1
      ? args[0]
      : { username: args[0], title: args[1], content: args[2] };

  const { username, title = 'Campus post', content, category = 'Other' } = payload;

  if (!username || !content) {
    throw new Error('Username and content are required.');
  }

  const normalizedContent = content.trim();

  if (!isValidPostContent(normalizedContent)) {
    throw new Error(
      `Post content must be between 1 and ${MAX_POST_LENGTH} characters.`
    );
  }

  const newPost = await createForum(
    username.trim(),
    title.trim(),
    normalizedContent,
    category
  );

  return sanitizePost(newPost);
};

export const getAllPosts = async () => {
  const posts = await getForumsPosts();
  return posts.map(sanitizePost);
};

export const getPostDetails = async (postId) => {
  const post = await getForumByForumId(postId);
  if (!post) {
    throw new Error('Post not found.');
  }
  return sanitizePost(post);
};

export const updateExistingPost = async (postId, titleOrPayload, contentArg) => {
  const content =
    typeof titleOrPayload === 'object' ? titleOrPayload.content : contentArg;

  if (!content) {
    throw new Error('Content is required.');
  }

  const normalizedContent = content.trim();

  if (!isValidPostContent(normalizedContent)) {
    throw new Error(
      `Post content must be between 1 and ${MAX_POST_LENGTH} characters.`
    );
  }

  const updatedPost = await updateForum(postId, normalizedContent);
  if (!updatedPost) {
    throw new Error('Post not found.');
  }

  return sanitizePost(updatedPost);
};

export const deleteExistingPost = async (postId) => {
  const deleted = await deleteForum(postId);
  if (!deleted) {
    throw new Error('Post not found.');
  }
  return sanitizePost(deleted);
};

export const getPostByCategory = async (category) => {
  const posts = await getForumsByCategory(category);
  return posts.map(sanitizePost);
};

export const likePost = async (postId) => {
  const liked = await likeForum(postId);
  if (!liked) {
    throw new Error('Post not found.');
  }
  return sanitizePost(liked);
};

export const dislikePost = async (postId) => {
  const disliked = await dislikeForum(postId);
  if (!disliked) {
    throw new Error('Post not found.');
  }
  return sanitizePost(disliked);
};
