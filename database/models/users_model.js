import pool from '../db.js';

export const createUser = async (username, email, passwordHash, fullName) => {
    const query = await pool.query(
        'INSERT INTO users (username, email, hashed_password, full_name) VALUES ($1, $2, $3, $4) RETURNING *',
        [username, email, passwordHash, fullName]
    )
    return query.rows[0];
};


export const getUserByUsername = async (username) => {
    const query = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
    );

    return query.rows[0];
}

export const getUserByEmail = async (email) => {
    const query = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );

    return query.rows[0];
}