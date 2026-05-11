import bcrypt from 'bcrypt';
import express from 'express';
import { createNewEvent, 
        getAllEvents, 
        getEventDetails, 
        updateExistingEvent, 
        deleteExistingEvent, 
        getEventsByUser,
        getEventsByCategory,
        addRSVP, 
        removeRSVP,  } from './event_logic.js';
import {
  createEvent,
  getEvents,
  getEventById,
} from './database/models/events_model.js';

const app = express();
const PORT = 5000;

app.use(express.json());

app.post('/events', async (req, res) => {
  try {
    const event = await createEvent(req.body);
    return res.json({ success: true, event });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});