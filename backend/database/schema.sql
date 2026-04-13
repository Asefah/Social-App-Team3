CREATE EXTENSION IF NOT EXISTS "pgcrypto";

--User Table
CREATE TABLE IF NOT EXISTS users (
    username     VARCHAR(50) PRIMARY KEY,
    hashed_password VARCHAR(255) NOT NULL,
    email        VARCHAR(255) NOT NULL UNIQUE,
    full_name    VARCHAR(255),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    user_school  VARCHAR(255),
    user_major   VARCHAR(255),
    user_year    VARCHAR(50),
    user_bio     VARCHAR(500),
    user_following  INTEGER NOT NULL DEFAULT 0,
    followers    INTEGER NOT NULL DEFAULT 0,
    posts        INTEGER NOT NULL DEFAULT 0,
    comments     INTEGER NOT NULL DEFAULT 0,
    active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS user_images (
    image_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username     VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    image_url    VARCHAR(255) NOT NULL,
    uploaded_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

--Events Categories Enum
CREATE TYPE events_category AS ENUM (
    'Academic',
    'Social',
    'Career',
    'Sports',
    'Clubs',
    'Recreational',
    'Other'
);

--Events Table
CREATE TABLE IF NOT EXISTS events (
    event_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username     VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    event_name   VARCHAR(200) NOT NULL,
    event_date   DATE NOT NULL,
    event_time   TIME NOT NULL,
    event_location VARCHAR(255) NOT NULL,
    category     events_category NOT NULL DEFAULT 'Other',
    RSVPs        INTEGER NOT NULL DEFAULT 0,
    edited_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    active       BOOLEAN NOT NULL DEFAULT TRUE
);

--Forum Categories Enum
CREATE TYPE forum_category AS ENUM (
    'Math',
    'Physics',
    'Chemistry',
    'Biology',
    'Business',
    'Computer Science/ Data Science',
    'General engineering',
    'Sociology',
    'Psychology',
    'History',
    'Art, Music, and Literature',
    'General Humanities',
    'Other'
);

--Forum Posts Table
CREATE TABLE IF NOT EXISTS forum_posts (
    forum_post_id   SERIAL PRIMARY KEY,
    username     VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    category     forum_category NOT NULL DEFAULT 'Other',
    content      VARCHAR(500) NOT NULL,
    likes        INTEGER NOT NULL DEFAULT 0,
    dislikes     INTEGER NOT NULL DEFAULT 0,
    edited_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

--Comments Table
CREATE TABLE IF NOT EXISTS comments (
    comment_id   SERIAL PRIMARY KEY,
    forum_post_id INTEGER NOT NULL REFERENCES forum_posts(forum_post_id) ON DELETE CASCADE,
    username     VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    content      VARCHAR(500) NOT NULL,
    likes        INTEGER NOT NULL DEFAULT 0,
    dislikes     INTEGER NOT NULL DEFAULT 0,
    edited_at    TIMESTAMP NOT NULL DEFAULT NOW()
);