CREATE TABLE IF NOT EXISTS user_follows (
  follower_username  VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  following_username VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_username, following_username),
  CHECK (follower_username <> following_username)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows (following_username);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows (follower_username);
