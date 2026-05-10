import pool from '../db.js';

export const listImagesForUser = async (username) => {
  const query = await pool.query(
    `SELECT image_id, image_url, uploaded_at
     FROM user_images
     WHERE username = $1
     ORDER BY uploaded_at DESC`,
    [username]
  );
  return query.rows;
};

export const addImageForUser = async (username, imageUrl) => {
  const query = await pool.query(
    'INSERT INTO user_images (username, image_url) VALUES ($1, $2) RETURNING *',
    [username, imageUrl]
  );
  return query.rows[0];
};
