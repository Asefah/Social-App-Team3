-- One like per user per forum post (Home likes / Study upvotes).

CREATE TABLE IF NOT EXISTS forum_post_likes (
  forum_post_id INTEGER NOT NULL REFERENCES forum_posts(forum_post_id) ON DELETE CASCADE,
  username      VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (forum_post_id, username)
);

CREATE INDEX IF NOT EXISTS idx_forum_post_likes_post_id ON forum_post_likes (forum_post_id);
