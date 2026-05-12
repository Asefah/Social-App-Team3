import pool from '../db.js';

export const createEvent = async (event) => {
    const eventName = event.eventName ?? event.event_name;
    const eventDate = event.eventDate ?? event.event_date;
    const eventTime = event.eventTime ?? event.event_time;
    const eventLocation = event.eventLocation ?? event.event_location;
    const category = event.category ?? 'Other';

    const query = await pool.query(
        'INSERT INTO events (username, event_name, event_date, event_time, event_location, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [event.username, eventName, eventDate, eventTime, eventLocation, category]
    );
    return query.rows[0];
};

export const getAllActiveEvents = async () => {
    const query = await pool.query(
        'SELECT * FROM events WHERE active = true ORDER BY edited_at DESC'
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

export const updateEvent = async (eventId, updates) => {
    const fields = [];
    const values = [];

    const eventName = updates.eventName ?? updates.event_name;
    const eventDate = updates.eventDate ?? updates.event_date;
    const eventTime = updates.eventTime ?? updates.event_time;
    const eventLocation = updates.eventLocation ?? updates.event_location;
    const rsvps = updates.rsvps ?? updates.RSVPs;

    if (eventName !== undefined) {
        fields.push(`event_name = $${values.length + 1}`);
        values.push(eventName);
    }
    if (eventDate !== undefined) {
        fields.push(`event_date = $${values.length + 1}`);
        values.push(eventDate);
    }
    if (eventTime !== undefined) {
        fields.push(`event_time = $${values.length + 1}`);
        values.push(eventTime);
    }
    if (eventLocation !== undefined) {
        fields.push(`event_location = $${values.length + 1}`);
        values.push(eventLocation);
    }
    if (updates.category !== undefined) {
        fields.push(`category = $${values.length + 1}`);
        values.push(updates.category);
    }
    if (rsvps !== undefined) {
        fields.push(`RSVPs = $${values.length + 1}`);
        values.push(rsvps);
    }
    if (updates.active !== undefined) {
        fields.push(`active = $${values.length + 1}`);
        values.push(updates.active);
    }

    if (fields.length === 0) {
        const query = await pool.query('SELECT * FROM events WHERE event_id = $1', [eventId]);
        return query.rows[0];
    }

    fields.push('edited_at = NOW()');
    const query = await pool.query(
        `UPDATE events SET ${fields.join(', ')} WHERE event_id = $${values.length + 1} RETURNING *`,
        [...values, eventId]
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
        'SELECT * FROM events WHERE category = $1 AND active = true ORDER BY edited_at DESC',
        [category]
    );
    return query.rows;
}

export const deleteEvent = async (eventId) => {
    const query = await pool.query(
        'DELETE FROM events WHERE event_id = $1 RETURNING *',
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

    static async createEvent({ username, eventName, eventDate, eventTime, eventLocation }) {
        const query = await this.pool.query(
            'INSERT INTO events (username, event_name, event_date, event_time, event_location) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [username, eventName, eventDate, eventTime, eventLocation]
        );
        return query.rows[0];
    }

    static async getAllActiveEvents() {
        const query = await this.pool.query(
            'SELECT * FROM events WHERE is_active = true ORDER BY created_at DESC'
        );
        return query.rows;
    }

    static async getEventById(eventId) {
        const query = await this.pool.query(
            'SELECT * FROM events WHERE event_id = $1',
            [eventId]
        );
        return query.rows[0];
    }

    static async updateEvent(eventId, updates) {
        const fields = [];
        const values = [];

        if (updates.eventName !== undefined) {
            fields.push(`event_name = $${values.length + 1}`);
            values.push(updates.eventName);
        }
        if (updates.eventDate !== undefined) {
            fields.push(`event_date = $${values.length + 1}`);
            values.push(updates.eventDate);
        }
        if (updates.eventTime !== undefined) {
            fields.push(`event_time = $${values.length + 1}`);
            values.push(updates.eventTime);
        }
        if (updates.eventLocation !== undefined) {
            fields.push(`event_location = $${values.length + 1}`);
            values.push(updates.eventLocation);
        }
        if (updates.category !== undefined) {
            fields.push(`category = $${values.length + 1}`);
            values.push(updates.category);
        }
        if (updates.rsvps !== undefined) {
            fields.push(`RSVPs = $${values.length + 1}`);
            values.push(updates.rsvps);
        }
        if (updates.active !== undefined) {
            fields.push(`active = $${values.length + 1}`);
            values.push(updates.active);
        }

        if (fields.length === 0) {
            const query = await this.pool.query('SELECT * FROM events WHERE event_id = $1', [eventId]);
            return query.rows[0];
        }

        fields.push('edited_at = NOW()');
        const query = await this.pool.query(
            `UPDATE events SET ${fields.join(', ')} WHERE event_id = $${values.length + 1} RETURNING *`,
            [...values, eventId]
        );
        return query.rows[0];
    }

    static async getEventIdByEventNameAndUsername(eventName, username) {
        const query = await this.pool.query(
            'SELECT event_id FROM events WHERE event_name = $1 AND username = $2',
            [eventName, username]
        );
        return query.rows[0];
    }

    static async getEventsByCategory(category) {
        const query = await this.pool.query(
            'SELECT * FROM events WHERE category = $1 AND is_active = true ORDER BY created_at DESC',
            [category]
        );
        return query.rows;
    }

    static async deleteEvent(eventId) {
        const query = await this.pool.query(
            'DELETE FROM events WHERE event_id = $1',
            [eventId]
        );
        return query.rows[0];
    }

    static async deactivateEvent(eventId) {
        const query = await this.pool.query(
            'UPDATE events SET active = false WHERE event_id = $1 RETURNING *',
            [eventId]
        );
        return query.rows[0];
    }
}
