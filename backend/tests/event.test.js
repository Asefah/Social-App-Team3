import { jest } from '@jest/globals';

jest.unstable_mockModule('../database/models/events_model.js', () => ({
  createEvent: jest.fn(),
  getAllActiveEvents: jest.fn(),
  getEventById: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
}));

const eventModel = await import('../database/models/events_model.js');

const {
  createNewEvent,
  getAllEvents,
  getEventDetails,
  updateExistingEvent,
  deleteExistingEvent,
  addRSVP,
  removeRSVP,
  getEventsByUser,
  getEventsByCategory,
} = await import('../event_logic.js');

beforeEach(() => {
  jest.clearAllMocks();
});

const futureDate = '2099-01-01';

const mockEvent = {
  event_id: 1,
  username: 'testuser',
  event_name: 'Career Fair',
  event_date: futureDate,
  event_time: '12:00',
  event_location: 'Campus Center',
  category: 'Career',
  rsvps: 2,
  edited_at: null,
  active: true,
};

describe('createNewEvent', () => {
  test('throws error for invalid event data', async () => {
    await expect(
      createNewEvent({
        eventName: '',
        eventDate: futureDate,
        eventTime: '12:00',
        eventLocation: 'Campus Center',
        category: 'Career',
        username: 'testuser',
      })
    ).rejects.toThrow('Invalid event data');
  });

  test('creates event successfully', async () => {
    eventModel.createEvent.mockResolvedValue(mockEvent);

    const result = await createNewEvent({
      eventName: 'Career Fair',
      eventDate: futureDate,
      eventTime: '12:00',
      eventLocation: 'Campus Center',
      category: 'Career',
      username: 'testuser',
    });

    expect(eventModel.createEvent).toHaveBeenCalled();
    expect(result.event_name).toBe('Career Fair');
    expect(result.category).toBe('Career');
  });
});

describe('getAllEvents', () => {
  test('returns only active events', async () => {
    eventModel.getAllActiveEvents.mockResolvedValue([
      mockEvent,
      { ...mockEvent, event_id: 2, active: false },
    ]);

    const result = await getAllEvents();

    expect(result.length).toBe(1);
    expect(result[0].active).toBe(true);
  });

  test('filters events by category', async () => {
    eventModel.getAllActiveEvents.mockResolvedValue([
      mockEvent,
      { ...mockEvent, event_id: 2, category: 'Sports' },
    ]);

    const result = await getAllEvents({ category: 'Career' });

    expect(result.length).toBe(1);
    expect(result[0].category).toBe('Career');
  });

  test('filters events by username', async () => {
    eventModel.getAllActiveEvents.mockResolvedValue([
      mockEvent,
      { ...mockEvent, event_id: 2, username: 'otheruser' },
    ]);

    const result = await getAllEvents({ username: 'testuser' });

    expect(result.length).toBe(1);
    expect(result[0].username).toBe('testuser');
  });
});

describe('getEventDetails', () => {
  test('throws error if event not found', async () => {
    eventModel.getEventById.mockResolvedValue(null);

    await expect(getEventDetails(1)).rejects.toThrow('Event not found');
  });

  test('throws error if event is inactive', async () => {
    eventModel.getEventById.mockResolvedValue({ ...mockEvent, active: false });

    await expect(getEventDetails(1)).rejects.toThrow('Event not found');
  });

  test('returns event details successfully', async () => {
    eventModel.getEventById.mockResolvedValue(mockEvent);

    const result = await getEventDetails(1);

    expect(result.event_id).toBe(1);
    expect(result.event_name).toBe('Career Fair');
  });
});

describe('updateExistingEvent', () => {
  test('throws error if event not found', async () => {
    eventModel.getEventById.mockResolvedValue(null);

    await expect(
      updateExistingEvent(1, { eventName: 'Updated Event' }, 'testuser')
    ).rejects.toThrow('Event not found');
  });

  test('throws error if user is not owner', async () => {
    eventModel.getEventById.mockResolvedValue(mockEvent);

    await expect(
      updateExistingEvent(1, { eventName: 'Updated Event' }, 'wronguser')
    ).rejects.toThrow('Unauthorized: Only the event owner can update this event.');
  });

  test('updates event successfully', async () => {
    const updatedEvent = {
      ...mockEvent,
      event_name: 'Updated Event',
    };

    eventModel.getEventById.mockResolvedValue(mockEvent);
    eventModel.updateEvent.mockResolvedValue(updatedEvent);

    const result = await updateExistingEvent(
      1,
      {
        eventName: 'Updated Event',
        eventDate: futureDate,
        eventTime: '12:00',
        eventLocation: 'Campus Center',
        category: 'Career',
      },
      'testuser'
    );

    expect(eventModel.updateEvent).toHaveBeenCalled();
    expect(result.event_name).toBe('Updated Event');
  });
});

describe('deleteExistingEvent', () => {
  test('throws error if event not found', async () => {
    eventModel.getEventById.mockResolvedValue(null);

    await expect(deleteExistingEvent(1, 'testuser')).rejects.toThrow('Event not found');
  });

  test('throws error if user is not owner', async () => {
    eventModel.getEventById.mockResolvedValue(mockEvent);

    await expect(deleteExistingEvent(1, 'wronguser')).rejects.toThrow(
      'Unauthorized: Only the event owner can delete this event.'
    );
  });

  test('deletes event successfully', async () => {
    eventModel.getEventById.mockResolvedValue(mockEvent);
    eventModel.deleteEvent.mockResolvedValue();

    const result = await deleteExistingEvent(1, 'testuser');

    expect(eventModel.deleteEvent).toHaveBeenCalledWith(1);
    expect(result.message).toBe('Event deleted successfully');
  });
});

describe('RSVP functions', () => {
  test('adds RSVP successfully', async () => {
    eventModel.getEventById.mockResolvedValue(mockEvent);
    eventModel.updateEvent.mockResolvedValue({
      ...mockEvent,
      rsvps: 3,
    });

    const result = await addRSVP(1, 'otheruser');

    expect(eventModel.updateEvent).toHaveBeenCalledWith(1, { rsvps: 3 });
    expect(result.RSVPs).toBe(3);
  });
  test('fails if category is invalid', async () => {
  await expect(
    createNewEvent({
      eventName: 'Test',
      eventDate: futureDate,
      eventTime: '12:00',
      eventLocation: 'Campus',
      category: 'Invalid',
      username: 'testuser',
    })
  ).rejects.toThrow('Invalid event data');
});

test('fails if event date is in the past', async () => {
  await expect(
    createNewEvent({
      eventName: 'Old Event',
      eventDate: '2000-01-01',
      eventTime: '12:00',
      eventLocation: 'Campus',
      category: 'Career',
      username: 'testuser',
    })
  ).rejects.toThrow('Invalid event data');
});
test('filters events by date range', async () => {
  eventModel.getAllActiveEvents.mockResolvedValue([
    { ...mockEvent, event_date: '2099-01-01' },
    { ...mockEvent, event_id: 2, event_date: '2099-05-01' },
  ]);

  const result = await getAllEvents({
    startDate: '2099-03-01',
    endDate: '2099-12-31',
  });

  expect(result.length).toBe(1);
});
test('fails RSVP for past event', async () => {
  eventModel.getEventById.mockResolvedValue({
    ...mockEvent,
    event_date: '2000-01-01',
  });

  await expect(addRSVP(1, 'user')).rejects.toThrow(
    'Cannot RSVP to a past event.'
  );
});
  test('removes RSVP successfully', async () => {
    eventModel.getEventById.mockResolvedValue(mockEvent);
    eventModel.updateEvent.mockResolvedValue({
      ...mockEvent,
      rsvps: 1,
    });

    const result = await removeRSVP(1, 'otheruser');

    expect(eventModel.updateEvent).toHaveBeenCalledWith(1, { rsvps: 1 });
    expect(result.RSVPs).toBe(1);
  });

  test('throws error when removing RSVP if none exist', async () => {
    eventModel.getEventById.mockResolvedValue({
      ...mockEvent,
      rsvps: 0,
    });

    await expect(removeRSVP(1, 'otheruser')).rejects.toThrow('No RSVPs to remove.');
  });
});

describe('event search helpers', () => {
  test('gets events by user', async () => {
    eventModel.getAllActiveEvents.mockResolvedValue([
      mockEvent,
      { ...mockEvent, event_id: 2, username: 'otheruser' },
    ]);

    const result = await getEventsByUser('testuser');

    expect(result.length).toBe(1);
    expect(result[0].username).toBe('testuser');
  });

  test('gets events by category', async () => {
    eventModel.getAllActiveEvents.mockResolvedValue([
      mockEvent,
      { ...mockEvent, event_id: 2, category: 'Sports' },
    ]);

    const result = await getEventsByCategory('Career');

    expect(result.length).toBe(1);
    expect(result[0].category).toBe('Career');
  });

  test('throws error for invalid category', async () => {
    await expect(getEventsByCategory('InvalidCategory')).rejects.toThrow('Invalid category');
  });
});