import pool from '../db.js';

export const createEvent = async (
  username,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  category = 'Other',
  imageUrl = null
) => {
  const query = await pool.query(
    `INSERT INTO events (username, event_name, event_date, event_time, event_location, category, image_url)
     VALUES ($1, $2, $3, $4, $5, $6::events_category, $7)
     RETURNING *`,
    [username, eventName, eventDate, eventTime, eventLocation, category, imageUrl]
  );
  return query.rows[0];
};

export const getAllActiveEvents = async () => {
  const query = await pool.query(
    'SELECT * FROM events WHERE active = true ORDER BY edited_at DESC'
  );
  return query.rows;
};

/** @param {string | null | undefined} viewerUsername */
export const getAllActiveEventsForViewer = async (viewerUsername) => {
  const query = await pool.query(
    `SELECT e.*,
      CASE WHEN $1::varchar IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM event_rsvps r
        WHERE r.event_id = e.event_id AND r.username = $1
      ) END AS user_has_rsvp
     FROM events e
     WHERE e.active = true
     ORDER BY e.edited_at DESC`,
    [viewerUsername ?? null]
  );
  return query.rows;
};

/** @param {string | null | undefined} viewerUsername */
export const getEventsByCategoryForViewer = async (category, viewerUsername) => {
  const query = await pool.query(
    `SELECT e.*,
      CASE WHEN $2::varchar IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM event_rsvps r
        WHERE r.event_id = e.event_id AND r.username = $2
      ) END AS user_has_rsvp
     FROM events e
     WHERE e.category = $1::events_category AND e.active = true
     ORDER BY e.edited_at DESC`,
    [category, viewerUsername ?? null]
  );
  return query.rows;
};

export const getEventById = async (eventId) => {
  const query = await pool.query(
    'SELECT * FROM events WHERE event_id = $1',
    [eventId]
  );
  return query.rows[0];
};

export const updateEvent = async (
  eventId,
  eventName,
  eventDate,
  eventTime,
  eventLocation
) => {
  const query = await pool.query(
    'UPDATE events SET event_name = $1, event_date = $2, event_time = $3, event_location = $4, edited_at = NOW() WHERE event_id = $5 RETURNING *',
    [eventName, eventDate, eventTime, eventLocation, eventId]
  );
  return query.rows[0];
};

export const getEventIdByEventNameAndUsername = async (eventName, username) => {
  const query = await pool.query(
    'SELECT event_id FROM events WHERE event_name = $1 AND username = $2',
    [eventName, username]
  );
  return query.rows[0];
};

export const getEventsByCategory = async (category) => {
  const query = await pool.query(
    'SELECT * FROM events WHERE category = $1::events_category AND active = true ORDER BY edited_at DESC',
    [category]
  );
  return query.rows;
};

export const deleteEvent = async (eventId) => {
  const query = await pool.query('DELETE FROM events WHERE event_id = $1', [
    eventId,
  ]);
  return query.rows[0];
};

export const deactivateEvent = async (eventId) => {
  const query = await pool.query(
    'UPDATE events SET active = false WHERE event_id = $1 RETURNING *',
    [eventId]
  );
  return query.rows[0];
};

/**
 * Record one RSVP for this user. Increments `events.rsvps` only on first RSVP per user.
 * @returns {Promise<{ ok: true, event: object } | { ok: false, notFound: true } | { ok: false, already: true, event: object }>}
 */
export const addEventRsvp = async (eventId, username) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const eventRes = await client.query(
      'SELECT * FROM events WHERE event_id = $1 AND active = true FOR UPDATE',
      [eventId]
    );
    const existing = eventRes.rows[0];
    if (!existing) {
      await client.query('ROLLBACK');
      return { ok: false, notFound: true };
    }
    const ins = await client.query(
      `INSERT INTO event_rsvps (event_id, username) VALUES ($1, $2)
       ON CONFLICT (event_id, username) DO NOTHING
       RETURNING event_id`,
      [eventId, username]
    );
    if (ins.rowCount === 0) {
      await client.query('ROLLBACK');
      return { ok: false, already: true, event: existing };
    }
    const upd = await client.query(
      'UPDATE events SET rsvps = rsvps + 1 WHERE event_id = $1 AND active = true RETURNING *',
      [eventId]
    );
    await client.query('COMMIT');
    return { ok: true, event: upd.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export class Event {
  pool = null;
  eventId = null;
  username = null;
  eventName = null;
  eventDate = null;
  eventTime = null;
  eventLocation = null;
  category = null;
  isActive = null;
  createdAt = null;
  editedAt = null;

  constructor(pool, username, eventName, eventDate, eventTime, eventLocation) {
    this.pool = pool;
    this.username = username;
    this.eventName = eventName;
    this.eventDate = eventDate;
    this.eventTime = eventTime;
    this.eventLocation = eventLocation;
  }

  static async createEvent(
    username,
    eventName,
    eventDate,
    eventTime,
    eventLocation,
    category,
    imageUrl
  ) {
    return createEvent(
      username,
      eventName,
      eventDate,
      eventTime,
      eventLocation,
      category,
      imageUrl
    );
  }

  static async getAllActiveEvents() {
    return getAllActiveEvents();
  }

  static async getEventById(eventId) {
    return getEventById(eventId);
  }

  static async updateEvent(
    eventId,
    eventName,
    eventDate,
    eventTime,
    eventLocation
  ) {
    return updateEvent(eventId, eventName, eventDate, eventTime, eventLocation);
  }

  static async getEventIdByEventNameAndUsername(eventName, username) {
    return getEventIdByEventNameAndUsername(eventName, username);
  }

  static async getEventsByCategory(category) {
    return getEventsByCategory(category);
  }

  static async deleteEvent(eventId) {
    return deleteEvent(eventId);
  }

  static async deactivateEvent(eventId) {
    return deactivateEvent(eventId);
  }
}
