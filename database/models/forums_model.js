import pool from '../db.js';

export const createForum = async (username, title, content) => {
    const query = await pool.query(
        'INSERT INTO forums (username, title, content) VALUES ($1, $2, $3) RETURNING *',
        [username, title, content]
    );
    return query.rows[0];
}

export const getForumsPosts = async () => {
    const query = await pool.query('SELECT * FROM forums ORDER BY created_at DESC');
    return query.rows;
}

export const getForumById = async (forumId) => {
    const query = await pool.query('SELECT * FROM forums WHERE forum_id = $1', [forumId]);
    return query.rows[0];
}

export const getForumsByCategory = async (category) => {
    const query = await pool.query('SELECT * FROM forums WHERE category = $1 ORDER BY created_at DESC', [category]);
    return query.rows;
}

export const updateForum = async (forumId, title, content) => {
    const query = await pool.query(
        'UPDATE forums SET title = $1, content = $2, edited_at = NOW() WHERE forum_id = $3 RETURNING *',
        [title, content, forumId]
    );
    return query.rows[0];
}

export const deleteForum = async (forumId) => {
    const query = await pool.query('DELETE FROM forums WHERE forum_id = $1', [forumId]);
    return query.rows[0];
}

export const likeForum = async (forumId) => {
    const query = await pool.query(
        'UPDATE forums SET likes = likes + 1 WHERE forum_id = $1 RETURNING *',
        [forumId]
    );
    return query.rows[0];
}

export const dislikeForum = async (forumId) => {
    const query = await pool.query(
        'UPDATE forums SET dislikes = dislikes + 1 WHERE forum_id = $1 RETURNING *',
        [forumId]
    );
    return query.rows[0];
}