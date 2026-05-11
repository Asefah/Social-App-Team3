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


const app = express();
const PORT = 5000;

app.use(express.json());

app.post('/events', async (req, res) => {
  try {
    const event = await createNewEvent(req.body);
    return res.json({ success: true, event });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.get("/events", async (req, res) => {
  try {
    const events = await getAllEvents();
    return res.json({ success: true, events });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.get("/events/:id", async (req, res) => {
  try {
    const event = await getEventDetails(req.params.id);
    return res.json({ success: true, event });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.get("/events/user/:username", async (req, res) => {
  try {
    const events = await getEventsByUser(req.params.username);
    return res.json({ success: true, events });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.get("/events/category/:category", async (req, res) => {
  try {
    const events = await getEventsByCategory(req.params.category);
    return res.json({ success: true, events });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.put("/events/:id", async (req, res) => {

  try {
    const event = await updateExistingEvent(req.params.id, req.body);
    return res.json({ success: true, event });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.delete("/events/:id", async (req, res) => {
  try {
    const event = await deleteExistingEvent(req.params.id);
    return res.json({ success: true, event });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.put("/events/:id/rsvp", async (req, res) => {
  try {
    const event = await addRSVP(req.params.id, req.body);
    return res.json({ success: true, event });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.delete("/events/:id/rsvp", async (req, res) => {
  try {
    const event = await removeRSVP(req.params.id, req.body);
    return res.json({ success: true, event });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});