function readMyVote(row) {
  const v = row.my_vote;
  if (v == null) return 0;
  const n = Number(v);
  return n === 1 || n === -1 ? n : 0;
}

function feedAuthorAvatar(row) {
  const u = row.author_avatar_url && String(row.author_avatar_url).trim();
  if (u) return u;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(row.username)}&background=E5E7EB&color=111827`;
}

function studyAuthorAvatar(row) {
  const u = row.author_avatar_url && String(row.author_avatar_url).trim();
  if (u) return u;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(row.username)}&background=EFF6FF&color=2563EB`;
}

const DEFAULT_POST_IMAGE =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200';

const DEFAULT_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200';

export function formatTimeAgo(input) {
  if (!input) return '';
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return '';
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(input).toLocaleDateString();
}

export function formatFeedPost(row) {
  const titlePart = row.title ? String(row.title) : '';
  const body = row.content ? String(row.content) : '';
  const caption = [titlePart, body].filter(Boolean).join('\n\n') || body;
  const myVote = readMyVote(row);

  return {
    id: String(row.forum_post_id),
    forumPostId: row.forum_post_id,
    username: row.username,
    avatar: feedAuthorAvatar(row),
    time: formatTimeAgo(row.edited_at),
    image: row.image_url || DEFAULT_POST_IMAGE,
    likes: Number(row.up_count ?? row.like_count ?? row.likes) || 0,
    likedByMe: myVote === 1,
    myVote,
    caption,
    comments: row.comment_count ?? 0,
    category: row.category,
  };
}

export function formatStudyPost(row) {
  const title =
    row.title && String(row.title).trim()
      ? String(row.title).trim()
      : String(row.content || '').slice(0, 120) || 'Study thread';
  const answerPreview = String(row.content || '').slice(0, 220);
  const myVote = readMyVote(row);

  return {
    id: String(row.forum_post_id),
    forumPostId: row.forum_post_id,
    author: row.username,
    time: formatTimeAgo(row.edited_at),
    category: row.category,
    title,
    tags: [],
    topAnswerBy: 'Community',
    answer: answerPreview || 'Add a reply to help out.',
    upvotes: Number(row.up_count ?? row.like_count ?? row.likes) || 0,
    downvotes: Number(row.down_count) || 0,
    likedByMe: myVote === 1,
    downvotedByMe: myVote === -1,
    myVote,
    comments: row.comment_count ?? 0,
    avatar: studyAuthorAvatar(row),
  };
}

export function formatEventRow(row) {
  const d = row.event_date
    ? new Date(row.event_date).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';
  const t = row.event_time
    ? String(row.event_time).slice(0, 5)
    : '';
  const rsvpCount = row.rsvps ?? row.RSVPs ?? 0;

  return {
    id: String(row.event_id),
    title: row.event_name,
    date: d,
    time: t,
    location: row.event_location,
    attendance: `${rsvpCount} going`,
    category: row.category,
    image: row.image_url || DEFAULT_EVENT_IMAGE,
    hasRsvped: Boolean(row.user_has_rsvp),
  };
}

export function formatResourceRow(row) {
  return {
    id: String(row.resource_id),
    title: row.title,
    description: row.description,
    hours: row.hours_text,
    isOpen: row.is_open,
    category: row.category,
    image: row.image_url || DEFAULT_EVENT_IMAGE,
    link: row.link_url,
  };
}
