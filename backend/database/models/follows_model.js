import pool from '../db.js';

export const isFollowing = async (followerUsername, followingUsername) => {
  const r = await pool.query(
    `SELECT 1 FROM user_follows
     WHERE follower_username = $1 AND following_username = $2
     LIMIT 1`,
    [followerUsername, followingUsername]
  );
  return r.rowCount > 0;
};

/** @returns {{ ok: boolean, alreadyFollowing?: boolean }} */
export const followUser = async (followerUsername, followingUsername) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ins = await client.query(
      `INSERT INTO user_follows (follower_username, following_username)
       VALUES ($1, $2)
       ON CONFLICT (follower_username, following_username) DO NOTHING
       RETURNING follower_username`,
      [followerUsername, followingUsername]
    );
    if (ins.rowCount === 0) {
      await client.query('ROLLBACK');
      return { ok: true, alreadyFollowing: true };
    }
    await client.query(
      `UPDATE users SET followers = followers + 1 WHERE username = $1`,
      [followingUsername]
    );
    await client.query(
      `UPDATE users SET user_following = user_following + 1 WHERE username = $1`,
      [followerUsername]
    );
    await client.query('COMMIT');
    return { ok: true, alreadyFollowing: false };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

/** @returns {{ ok: boolean, wasFollowing: boolean }} */
export const unfollowUser = async (followerUsername, followingUsername) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const del = await client.query(
      `DELETE FROM user_follows
       WHERE follower_username = $1 AND following_username = $2
       RETURNING follower_username`,
      [followerUsername, followingUsername]
    );
    if (del.rowCount === 0) {
      await client.query('ROLLBACK');
      return { ok: true, wasFollowing: false };
    }
    await client.query(
      `UPDATE users SET followers = GREATEST(followers - 1, 0) WHERE username = $1`,
      [followingUsername]
    );
    await client.query(
      `UPDATE users SET user_following = GREATEST(user_following - 1, 0) WHERE username = $1`,
      [followerUsername]
    );
    await client.query('COMMIT');
    return { ok: true, wasFollowing: true };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};
