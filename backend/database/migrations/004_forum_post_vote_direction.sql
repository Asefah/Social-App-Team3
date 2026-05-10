-- +1 upvote / -1 downvote per user per post; remove row to clear vote.

ALTER TABLE forum_post_likes
  ADD COLUMN IF NOT EXISTS vote SMALLINT NOT NULL DEFAULT 1;

ALTER TABLE forum_post_likes DROP CONSTRAINT IF EXISTS forum_post_likes_vote_chk;
ALTER TABLE forum_post_likes
  ADD CONSTRAINT forum_post_likes_vote_chk CHECK (vote IN (-1, 1));
