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

export const updateUserProfile = async (username, fullName, userSchool, userMajor, userYear, userBio) => {
    const query = await pool.query(
        'UPDATE users SET full_name = $1, user_school = $2, user_major = $3, user_year = $4, user_bio = $5 WHERE username = $6 RETURNING *',
        [fullName, userSchool, userMajor, userYear, userBio, username]
    );
    return query.rows[0];
}

export const getUserFollowersCount = async (username) => {
    const query = await pool.query(
        'SELECT followers FROM users WHERE username = $1',
        [username]
    );
    return query.rows[0].followers;
}

export const getUserFollowingCount = async (username) => {
    const query = await pool.query(
        'SELECT user_following FROM users WHERE username = $1',
        [username]
    );
    return query.rows[0].user_following;
}

export const updatePassword = async (new_passwordHash, username) => {
    const query = await pool.query(
        'UPDATE users SET hashed_password = $1 WHERE username = $2 RETURNING *',
        [new_passwordHash, username]
    );
    return query.rows[0];
}

export const deactivateUser = async (username) => {
    const query = await pool.query(
        'UPDATE users SET active = false WHERE username = $1 RETURNING *',
        [username]
    );
    return query.rows[0];
}