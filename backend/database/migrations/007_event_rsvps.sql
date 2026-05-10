-- One RSVP per user per event (enforced for new RSVPs; legacy aggregate `events.rsvps` unchanged).
CREATE TABLE IF NOT EXISTS event_rsvps (
  event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, username)
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_username ON event_rsvps(username);
