import pool from '../db.js';

export const createUser = async (
    username,
    email,
    passwordHash,
    fullName,
    userSchool,
    userMajor,
    userYear
) => {
    const query = await pool.query(
        'INSERT INTO users (username, email, hashed_password, full_name, user_school, user_major, user_year) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [username, email, passwordHash, fullName, userSchool, userMajor, userYear]
    );
    return query.rows[0];
};


export const getUserByUsername = async (username) => {
    const query = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
    );

    return query.rows[0];
};

/** Matches profile grid: forum posts with an image + manual user_images. */
export const getProfileGridPostCount = async (username) => {
    const query = await pool.query(
        `SELECT
          (
            COALESCE(
              (SELECT COUNT(*)::int FROM forum_posts fp
               WHERE fp.username = $1
                 AND fp.post_kind = 'home'
                 AND fp.image_url IS NOT NULL
                 AND BTRIM(fp.image_url) <> ''),
              0
            )
            + COALESCE(
              (SELECT COUNT(*)::int FROM user_images ui WHERE ui.username = $1),
              0
            )
          ) AS n`,
        [username]
    );
    return Number(query.rows[0]?.n ?? 0);
};

export const getUserByUsernameWithPostCount = async (username) => {
    const user = await getUserByUsername(username);
    if (!user) return null;
    const posts = await getProfileGridPostCount(username);
    return { ...user, posts };
};

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

export const setUserAvatarUrl = async (username, avatarUrl) => {
    const query = await pool.query(
        'UPDATE users SET avatar_url = $1 WHERE username = $2 RETURNING *',
        [avatarUrl, username]
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

export class User {
    pool = null;
    username = null;
    email = null;
    hashedPassword = null;
    fullName = null;
    userSchool = null;
    userMajor = null;
    userYear = null;
    userBio = null;
    followers = null;
    userFollowing = null;
    active = null;

    constructor(pool, username, email, hashedPassword, fullName) {
        this.pool = pool;
        this.username = username;
        this.email = email;
        this.hashedPassword = hashedPassword;
        this.fullName = fullName;
    }

    static async createUser(username, email, passwordHash, fullName, userSchool, userMajor, userYear) {
        return createUser(username, email, passwordHash, fullName, userSchool, userMajor, userYear);
    }

    static async getUserByUsername(username) {
        const query = await this.pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        return query.rows[0];
    }

    static async getUserByEmail(email) {
        const query = await this.pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return query.rows[0];
    }

    static async updateUserProfile(username, fullName, userSchool, userMajor, userYear, userBio) {
        const query = await this.pool.query(
            'UPDATE users SET full_name = $1, user_school = $2, user_major = $3, user_year = $4, user_bio = $5 WHERE username = $6 RETURNING *',
            [fullName, userSchool, userMajor, userYear, userBio, username]
        );
        return query.rows[0];
    }

    static async getUserFollowersCount(username) {
        const query = await this.pool.query(
            'SELECT followers FROM users WHERE username = $1',
            [username]
        );
        return query.rows[0].followers;
    }

    static async getUserFollowingCount(username) {
        const query = await this.pool.query(
            'SELECT user_following FROM users WHERE username = $1',
            [username]
        );
        return query.rows[0].user_following;
    }

    static async updatePassword(new_passwordHash, username) {
        const query = await this.pool.query(
            'UPDATE users SET hashed_password = $1 WHERE username = $2 RETURNING *',
            [new_passwordHash, username]
        );
        return query.rows[0];
    }

    static async deactivateUser(username) {
        const query = await this.pool.query(
            'UPDATE users SET active = false WHERE username = $1 RETURNING *',
            [username]
        );
        return query.rows[0];
    }
}
