import {
  createForum,
  getForumByForumId,
  getForumByUsername,
  getForumsByCategory,
  updateForum,
  deleteForum,
  likeForum,
  dislikeForum
} from './database/models/forums_model.js';

const MAX_POST_LENGTH = 5000;

const isValidPostContent = (content) => {
  if (!content || typeof content !== 'string') return false;

  const trimmed = content.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > MAX_POST_LENGTH) return false;

  return true;
};

const sanitizePost = (post) => {
  return {
    post_id: post.post_id,
    username: post.username,
    category: post.category,
    content: post.content,
  };
};

export const createNewPost = async ({ username, content }) => {
  if (!username || !content) {
    throw new Error('User ID and content are required.');
  }

  const normalizedContent = content.trim();

  if (!isValidPostContent(normalizedContent)) {
    throw new Error(
      `Post content must be between 1 and ${MAX_POST_LENGTH} characters.`
    );
  }

  const newPost = await createForum(username, normalizedContent);

  return sanitizePost(newPost);
};

export const getAllPosts = async () => {
  const posts = await getAllForums();
  return posts.map(sanitizePost);
};

export const getPostDetails = async (postId) => {
  const post = await getForumById(postId);
  if (!post) {
    throw new Error('Post not found.');
  }
  return sanitizePost(post);
};

export const updateExistingPost = async (postId, { content }) => {
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
};

export const dislikePost = async (postId) => {
  const disliked = await dislikeForum(postId);
  if (!disliked) {
    throw new Error('Post not found.');
  }
};