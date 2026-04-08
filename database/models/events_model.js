import pool from '../db.js';

export const createEvent = async (username, eventName, eventDate, eventTime, eventLocation) => {
    const query = await pool.query(
        'INSERT INTO events (username, event_name, event_date, event_time, event_location) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [username, eventName, eventDate, eventTime, eventLocation]
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

export const updateEvent = async (eventId, eventName, eventDate, eventTime, eventLocation) => {
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
}

export const getEventsByCategory = async (category) => {
    const query = await pool.query(
        'SELECT * FROM events WHERE category = $1 AND is_active = true ORDER BY created_at DESC',   
        [category]
    );
    return query.rows;
}

export const deleteEvent = async (eventId) => {
    const query = await pool.query(
        'DELETE FROM events WHERE event_id = $1',
        [eventId]
    );
    return query.rows[0];
}

export const deactivateEvent = async (eventId) => {
    const query = await pool.query(
        'UPDATE events SET active = false WHERE event_id = $1 RETURNING *',
        [eventId]
    );
    return query.rows[0];
}