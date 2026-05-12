import pool from '../db.js';

const mapForumRow = (row) => {
  if (!row) return row;

  return {
    ...row,
    forum_id: row.forum_id ?? row.forum_post_id,
    forum_post_id: row.forum_post_id ?? row.forum_id,
    title: row.title ?? 'Campus post',
  };
};

export const createForum = async (
  username,
  titleOrContent,
  content,
  category = 'Other'
) => {
  const title = content ? titleOrContent : 'Campus post';
  const postContent = content ?? titleOrContent;

  const query = await pool.query(
    'INSERT INTO forum_posts (username, category, content) VALUES ($1, $2, $3) RETURNING *',
    [username, category, postContent]
  );

  return mapForumRow(query.rows[0]);
};

export const getForumsPosts = async () => {
  const query = await pool.query(
    'SELECT * FROM forum_posts ORDER BY edited_at DESC'
  );
  return query.rows.map(mapForumRow);
};

export const getForumByUsername = async (username) => {
  const query = await pool.query(
    'SELECT * FROM forum_posts WHERE username = $1 ORDER BY edited_at DESC',
    [username]
  );
  return query.rows.map(mapForumRow);
};

export const getForumByForumId = async (forumId) => {
  const query = await pool.query(
    'SELECT * FROM forum_posts WHERE forum_post_id = $1',
    [forumId]
  );
  return mapForumRow(query.rows[0]);
};

export const getForumById = getForumByForumId;

export const getForumsByCategory = async (category) => {
  const query = await pool.query(
    'SELECT * FROM forum_posts WHERE category = $1 ORDER BY edited_at DESC',
    [category]
  );
  return query.rows.map(mapForumRow);
};

export const updateForum = async (forumId, titleOrContent, content) => {
  const postContent = content ?? titleOrContent;

  const query = await pool.query(
    'UPDATE forum_posts SET content = $1, edited_at = NOW() WHERE forum_post_id = $2 RETURNING *',
    [postContent, forumId]
  );
  return mapForumRow(query.rows[0]);
};

export const deleteForum = async (forumId) => {
  const query = await pool.query(
    'DELETE FROM forum_posts WHERE forum_post_id = $1 RETURNING *',
    [forumId]
  );
  return mapForumRow(query.rows[0]);
};

export const likeForum = async (forumId) => {
  const query = await pool.query(
    'UPDATE forum_posts SET likes = likes + 1 WHERE forum_post_id = $1 RETURNING *',
    [forumId]
  );
  return mapForumRow(query.rows[0]);
};

export const dislikeForum = async (forumId) => {
  const query = await pool.query(
    'UPDATE forum_posts SET dislikes = dislikes + 1 WHERE forum_post_id = $1 RETURNING *',
    [forumId]
  );
  return mapForumRow(query.rows[0]);
};
