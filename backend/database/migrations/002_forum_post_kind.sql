-- Split social Home feed from Study Q&A (same comments/likes tables, separate lists).

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS post_kind VARCHAR(20) NOT NULL DEFAULT 'home';

-- Existing rows with a title were created as Study questions.
UPDATE forum_posts
SET post_kind = 'study'
WHERE title IS NOT NULL AND BTRIM(title) <> '';

CREATE INDEX IF NOT EXISTS idx_forum_posts_post_kind ON forum_posts (post_kind);
