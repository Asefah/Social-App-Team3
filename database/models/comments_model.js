import pool from '../db.js';

export const createComment = async (forumPostId, username, content) => {
    const query = await pool.query(
        'INSERT INTO comments (forum_post_id, username, content) VALUES ($1, $2, $3) RETURNING *',
        [forumPostId, username, content]
    );
    return query.rows[0];
}

export const getCommentsByForumPostId = async (forumPostId) => {
    const query = await pool.query(
        'SELECT * FROM comments WHERE forum_post_id = $1 ORDER BY created_at ASC',
        [forumPostId]
    );
    return query.rows;
}

export const updateComment = async (commentId, content) => {
    const query = await pool.query(
        'UPDATE comments SET content = $1, edited_at = NOW() WHERE comment_id = $2 RETURNING *',
        [content, commentId]
    );
    return query.rows[0];
}

export const deleteComment = async (commentId) => {
    const query = await pool.query(
        'DELETE FROM comments WHERE comment_id = $1',
        [commentId]
    );
    return query.rows[0];
}

export const likeComment = async (commentId) => {
    const query = await pool.query(
        'UPDATE comments SET likes = likes + 1 WHERE comment_id = $1 RETURNING *',
        [commentId]
    );
    return query.rows[0];
}

export const dislikeComment = async (commentId) => {
    const query = await pool.query(
        'UPDATE comments SET dislikes = dislikes + 1 WHERE comment_id = $1 RETURNING *',
        [commentId]
    );
    return query.rows[0];
}