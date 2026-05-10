import pool from '../db.js';

export const listResources = async ({ category } = {}) => {
  const params = [];
  let where = '1=1';
  if (category && category !== 'All') {
    params.push(category);
    where = `category = $${params.length}`;
  }
  const query = await pool.query(
    `SELECT resource_id, title, description, hours_text, is_open, category, image_url, link_url
     FROM resources
     WHERE ${where}
     ORDER BY title ASC`,
    params
  );
  return query.rows;
};
