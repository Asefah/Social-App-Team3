CREATE EXTENSION IF NOT EXISTS "pgcrypto";

--User Table
CREATE TABLE IF NOT EXISTS users (
    username     VARCHAR(50) PRIMARY KEY,
    hashed_password VARCHAR(255) NOT NULL,
    email        VARCHAR(255) NOT NULL UNIQUE,
    full_name    VARCHAR(255),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    followers    INTEGER NOT NULL DEFAULT 0,
    posts        INTEGER NOT NULL DEFAULT 0,
    comments     INTEGER NOT NULL DEFAULT 0,
    active       BOOLEAN NOT NULL DEFAULT TRUE
);

--Events Table
CREATE TABLE IF NOT EXISTS events (
    event_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username     VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    event_name   VARCHAR(200) NOT NULL,
    title        VARCHAR(200) NOT NULL,
    event_description  VARCHAR(5000) NOT NULL,
    likes        INTEGER NOT NULL DEFAULT 0,
    edited_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    active       BOOLEAN NOT NULL DEFAULT TRUE
);

--Forum Posts Table
CREATE TABLE IF NOT EXISTS forum_posts (
    forum_post_id   SERIAL PRIMARY KEY,
    username     VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
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