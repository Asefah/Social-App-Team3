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


// Exportable Class
export class Comment {
    pool = null;
    commentId = null;
    forumPostId = null
    username = null;
    content = null
    createdAt = null;
    editedAt = null;
    likes = null
    dislikes = null;

    constructor(pool, content, forumPostId, username) {
        this.pool = pool;
        this.content = content;
        this.forumPostId = forumPostId;
        this.username = username;
    }

    static async createComment(forumPostId, username, content) {
        const query = await this.pool.query(
            'INSERT INTO comments (forum_post_id, username, content) VALUES ($1, $2, $3) RETURNING *',
            [forumPostId, username, content]
        );
        return query.rows[0];
    }

    static async getCommentsByForumPostId(forumPostId) {
        const query = await this.pool.query(
            'SELECT * FROM comments WHERE forum_post_id = $1 ORDER BY created_at ASC',
            [forumPostId]
        );
        return query.rows;
    }

    static async updateComment(commentId, content) {
        //check if comment exists
        const existsQuery = await this.pool.query(
            'SELECT * FROM comments WHERE comment_id = $1',
            [commentId]
        );

        if (existsQuery.rows.length === 0) {
            throw new Error('Comment not found!');
        }

        const comment_user = existsQuery.rows[0].username;


        // check if the comment belongs to the user
        if (comment_user !== this.username) {
            throw new Error('Unauthorized to edit this comment!');
        } else {
            const query = await this.pool.query(
                'UPDATE comments SET content = $1, edited_at = NOW() WHERE comment_id = $2 RETURNING *',
                [content, commentId]
            );
            return query.rows[0];
        }
    }

    static async deleteComment(commentId) {
        //check if comment exists
        const existsQuery = await this.pool.query(
            'SELECT * FROM comments WHERE comment_id = $1',
            [commentId]
        );

        if (existsQuery.rows.length === 0) {
            throw new Error('Comment not found!');
        }

        const comment_user = existsQuery.rows[0].username;

        // check if the comment belongs to the user
        if (comment_user !== this.username) {
            throw new Error('Unauthorized to delete this comment!');
        } else {
            const query = await this.pool.query(
                'DELETE FROM comments WHERE comment_id = $1',
                [commentId]
            );
            return query.rows[0];
        }
    }

    static async likeComment(commentId) {
        const query = await this.pool.query(
            'UPDATE comments SET likes = likes + 1 WHERE comment_id = $1 RETURNING *',
            [commentId]
        );
        return query.rows[0];
    }

    static async dislikeComment(commentId) {
        const query = await this.pool.query(
            'UPDATE comments SET dislikes = dislikes + 1 WHERE comment_id = $1 RETURNING *',
            [commentId]
        );
        return query.rows[0];
    }

}