import pool from '../db.js';

export const createEvent = async (username, eventName, title, description) => {
    const query = await pool.query(
        'INSERT INTO events (username, event_name, title, event_description) VALUES ($1, $2, $3, $4) RETURNING *',
        [username, eventName, title, description]
    );
    return query.rows[0];
};

export const getAllActiveEvents = async () => {
    const query = await pool.query(
        'SELECT * FROM events WHERE is_active = true ORDER BY created_at DESC'
    );
    return query.rows;
};

export const getEventById = async (eventId) => {
    const query = await pool.query(
        'SELECT * FROM events WHERE event_id = $1',
        [eventId]
    );
    return query.rows[0];
}

export const updateEvent = async (eventId, title, description) => {
    const query = await pool.query(
        'UPDATE events SET title = $1, event_description = $2, edited_at = NOW() WHERE event_id = $3 RETURNING *',
        [title, description, eventId]
    );
    return query.rows[0];
};

export const getEventIdByEventNameAndUsername = async (eventName, username) => {
    const query = await pool.query(
        'SELECT event_id FROM events WHERE event_name = $1 AND username = $2',
        [eventName, username]
    );
    return query.rows[0];
}

export const deleteEvent = async (eventId) => {
    const query = await pool.query(
        'DELETE FROM events WHERE event_id = $1',
        [eventId]
    );
    return query.rows[0];
}