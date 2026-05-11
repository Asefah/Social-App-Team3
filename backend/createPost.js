import {
  createForum
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
