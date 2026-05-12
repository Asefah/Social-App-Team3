import {
    createEvent,
    getAllActiveEvents,
    getEventById,
    updateEvent,
    deleteEvent
} from './database/models/events_model.js';


const ALLOWED_CATEGORIES = ['Academic', 'Social', 'Career', 'Sports', 'Clubs', 'Recreational', 'Other'];

const isEventValid = (event) => {
    const eventName = event.eventName ?? event.event_name;
    const eventDate = event.eventDate ?? event.event_date;
    const eventTime = event.eventTime ?? event.event_time;
    const eventLocation = event.eventLocation ?? event.event_location;

    if (!eventName || !eventDate || !eventTime || !eventLocation) {
        return false;
    }

    if (!ALLOWED_CATEGORIES.includes(event.category)) {
        return false;
    }

    // Additional validations: ensure date is future, time format, etc.
    const eventDateTime = new Date(`${eventDate}T${eventTime}`);
    if (isNaN(eventDateTime.getTime()) || eventDateTime <= new Date()) {
        return false;
    }

    return true;
};

const normalizeEvent = (event) => {
    return {
        event_name: event.eventName?.trim() || '',
        event_date: event.eventDate || '',
        event_time: event.eventTime || '',
        category: event.category?.trim() || 'Other',
        event_location: event.eventLocation?.trim() || '',
        username: event.username?.trim() || '',
    };
};

const sanitizeEvent = (event) => {
    return {
        event_id: event.event_id,
        username: event.username,
        event_name: event.event_name,
        event_date: event.event_date,
        event_time: event.event_time,
        event_location: event.event_location,
        category: event.category,
        RSVPs: event.rsvps ?? event.RSVPs ?? 0,
        edited_at: event.edited_at,
        active: event.active,
    };
};

const isEventOwner = (event, username) => {
    if (!username) return true;
    return event.username === username;
};

const isValidEventUpdate = (updateData, existingEvent, username) => {
    if (!isEventOwner(existingEvent, username)) {
        throw new Error('Unauthorized: Only the event owner can update this event.');
    }

    if (!existingEvent.active) {
        throw new Error('Cannot update a deleted event.');
    }

    // Validate updated fields
    const updatedEvent = { ...existingEvent, ...updateData };
    return isEventValid(updatedEvent);
};

const isValidRSVP = (event, username) => {
    if (!event.active) {
        throw new Error('Cannot RSVP to a deleted event.');
    }

    const eventDateTime = new Date(`${event.event_date}T${event.event_time}`);
    if (eventDateTime <= new Date()) {
        throw new Error('Cannot RSVP to a past event.');
    }

    return true;
};

export const createNewEvent = async (eventData) => {
    if (!isEventValid(eventData)) {
        throw new Error('Invalid event data');
    }

    const normalizedData = normalizeEvent(eventData);
    const event = await createEvent(normalizedData);
    return sanitizeEvent(event);
};

export const getAllEvents = async (filters = {}) => {
    const events = await getAllActiveEvents();
    let filteredEvents = events.filter(event => event.active);

    if (filters.category) {
        filteredEvents = filteredEvents.filter(event => event.category === filters.category);
    }

    if (filters.username) {
        filteredEvents = filteredEvents.filter(event => event.username === filters.username);
    }

    // Add date range filter if needed
    if (filters.startDate) {
        filteredEvents = filteredEvents.filter(event => new Date(event.event_date) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
        filteredEvents = filteredEvents.filter(event => new Date(event.event_date) <= new Date(filters.endDate));
    }

    return filteredEvents.map(sanitizeEvent);
};

export const getEventDetails = async (eventId) => {
    const event = await getEventById(eventId);
    if (!event || !event.active) {
        throw new Error('Event not found');
    }
    return sanitizeEvent(event);
};

export const updateExistingEvent = async (eventId, updateData, username) => {
    const existingEvent = await getEventById(eventId);
    if (!existingEvent) {
        throw new Error('Event not found');
    }

    if (!isValidEventUpdate(updateData, existingEvent, username)) {
        throw new Error('Invalid update data');
    }

    const normalizedUpdate = normalizeEvent({ ...existingEvent, ...updateData });
    const updatedEvent = await updateEvent(eventId, normalizedUpdate);
    return sanitizeEvent(updatedEvent);
};

export const deleteExistingEvent = async (eventId, username) => {
    const event = await getEventById(eventId);
    if (!event) {
        throw new Error('Event not found');
    }

    if (!isEventOwner(event, username)) {
        throw new Error('Unauthorized: Only the event owner can delete this event.');
    }

    if (!event.active) {
        throw new Error('Event is already deleted.');
    }

    await deleteEvent(eventId);
    return { message: 'Event deleted successfully' };
};

export const addRSVP = async (eventId, username) => {
    const event = await getEventById(eventId);
    if (!event) {
        throw new Error('Event not found');
    }

    isValidRSVP(event, username);

    // Increment RSVPs
    const updatedEvent = await updateEvent(eventId, { rsvps: event.rsvps + 1 });
    return sanitizeEvent(updatedEvent);
};

export const removeRSVP = async (eventId, username) => {
    const event = await getEventById(eventId);
    if (!event) {
        throw new Error('Event not found');
    }

    if (!event.active) {
        throw new Error('Cannot remove RSVP from a deleted event.');
    }

    if (event.rsvps <= 0) {
        throw new Error('No RSVPs to remove.');
    }

    // Decrement RSVPs
    const updatedEvent = await updateEvent(eventId, { rsvps: event.rsvps - 1 });
    return sanitizeEvent(updatedEvent);
};

export const getEventsByUser = async (username) => {
    const events = await getAllActiveEvents();
    const userEvents = events.filter(event => event.username === username && event.active);
    return userEvents.map(sanitizeEvent);
};

export const getEventsByCategory = async (category) => {
    if (!ALLOWED_CATEGORIES.includes(category)) {
        throw new Error('Invalid category');
    }

    const events = await getAllActiveEvents();
    const categoryEvents = events.filter(event => event.category === category && event.active);
    return categoryEvents.map(sanitizeEvent);
};
