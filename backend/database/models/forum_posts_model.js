import pool from '../db.js';

const VALID_KINDS = new Set(['home', 'study']);

function voteAggregatesSql(viewerParamIndex) {
  const upCountSql = `(SELECT COUNT(*)::int FROM forum_post_likes fpl WHERE fpl.forum_post_id = fp.forum_post_id AND fpl.vote = 1)`;
  const downCountSql = `(SELECT COUNT(*)::int FROM forum_post_likes fpl WHERE fpl.forum_post_id = fp.forum_post_id AND fpl.vote = -1)`;
  if (!viewerParamIndex) {
    return {
      upCountSql,
      downCountSql,
      myVoteSql: 'NULL::smallint',
    };
  }
  const myVoteSql = `(SELECT fplm.vote FROM forum_post_likes fplm WHERE fplm.forum_post_id = fp.forum_post_id AND fplm.username = $${viewerParamIndex} LIMIT 1)`;
  return { upCountSql, downCountSql, myVoteSql };
}

export const listForumPosts = async ({
  category,
  postKind = 'home',
  viewerUsername = null,
} = {}) => {
  const kind = VALID_KINDS.has(postKind) ? postKind : 'home';
  const params = [kind];
  let where = `fp.post_kind = $1`;
  if (category && category !== 'All') {
    params.push(category);
    where += ` AND fp.category::text = $${params.length}`;
  }
  const viewer = viewerUsername && String(viewerUsername).trim();
  if (viewer) {
    params.push(viewer);
  }
  const { upCountSql, downCountSql, myVoteSql } = voteAggregatesSql(
    viewer ? params.length : null
  );
  const query = await pool.query(
    `SELECT fp.*,
      u_poster.avatar_url AS author_avatar_url,
      (SELECT COUNT(*)::int FROM comments c WHERE c.forum_post_id = fp.forum_post_id) AS comment_count,
      ${upCountSql} AS up_count,
      ${downCountSql} AS down_count,
      ${myVoteSql} AS my_vote
     FROM forum_posts fp
     LEFT JOIN users u_poster ON u_poster.username = fp.username
     WHERE ${where}
     ORDER BY fp.forum_post_id DESC`,
    params
  );
  return query.rows;
};

export const getForumPostById = async (forumPostId, viewerUsername = null) => {
  const viewer = viewerUsername && String(viewerUsername).trim();
  const params = [forumPostId];
  if (viewer) {
    params.push(viewer);
  }
  const { upCountSql, downCountSql, myVoteSql } = voteAggregatesSql(
    viewer ? 2 : null
  );
  const query = await pool.query(
    `SELECT fp.*,
      u_poster.avatar_url AS author_avatar_url,
      (SELECT COUNT(*)::int FROM comments c WHERE c.forum_post_id = fp.forum_post_id) AS comment_count,
      ${upCountSql} AS up_count,
      ${downCountSql} AS down_count,
      ${myVoteSql} AS my_vote
     FROM forum_posts fp
     LEFT JOIN users u_poster ON u_poster.username = fp.username
     WHERE fp.forum_post_id = $1`,
    params
  );
  return query.rows[0];
};

export const createForumPost = async (
  username,
  { category = 'Other', title = null, content, imageUrl = null, postKind = 'home' }
) => {
  const kind = VALID_KINDS.has(postKind) ? postKind : 'home';
  const query = await pool.query(
    `INSERT INTO forum_posts (username, category, content, title, image_url, post_kind)
     VALUES ($1, $2::forum_category, $3, $4, $5, $6)
     RETURNING *`,
    [username, category, content, title, imageUrl, kind]
  );
  return query.rows[0];
};

/**
 * @param {number} vote 1 = up, -1 = down, 0 = remove vote
 */
export const setForumPostVote = async (forumPostId, username, vote) => {
  if (vote === 0) {
    await pool.query(
      'DELETE FROM forum_post_likes WHERE forum_post_id = $1 AND username = $2',
      [forumPostId, username]
    );
    return;
  }
  await pool.query(
    `INSERT INTO forum_post_likes (forum_post_id, username, vote) VALUES ($1, $2, $3)
     ON CONFLICT (forum_post_id, username) DO UPDATE SET vote = EXCLUDED.vote`,
    [forumPostId, username, vote]
  );
};

export const listForumCategories = async () => {
  const query = await pool.query(
    `SELECT unnest(enum_range(NULL::forum_category))::text AS category`
  );
  return query.rows.map((r) => r.category);
};

/** Social-feed posts with a real image URL (for profile grid). */
export const listForumPostImagesForUser = async (username) => {
  const query = await pool.query(
    `SELECT forum_post_id, image_url
     FROM forum_posts
     WHERE username = $1
       AND post_kind = 'home'
       AND image_url IS NOT NULL
       AND trim(image_url) <> ''
     ORDER BY forum_post_id DESC`,
    [username]
  );
  return query.rows;
};
