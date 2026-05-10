-- Run once against your app database (psql or GUI), after schema.sql

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS title VARCHAR(200),
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

CREATE TABLE IF NOT EXISTS resources (
  resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  hours_text VARCHAR(255),
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  category VARCHAR(100) NOT NULL DEFAULT 'Academic',
  image_url VARCHAR(500),
  link_url VARCHAR(500) NOT NULL
);

INSERT INTO resources (title, description, hours_text, is_open, category, image_url, link_url)
SELECT 'W.E.B. Du Bois Library',
  'Access to millions of books, research databases, study spaces, and academic support services.',
  'Mon-Fri • 8:00AM-11:00PM',
  TRUE,
  'Academic',
  'https://www.umass.edu/sites/default/files/2022-04/Du%20Bois%20Drone%202.JPG',
  'https://www.library.umass.edu/'
WHERE NOT EXISTS (SELECT 1 FROM resources LIMIT 1);

INSERT INTO resources (title, description, hours_text, is_open, category, image_url, link_url)
SELECT 'University Health Services',
  'Primary care, mental health counseling, preventive care, and urgent care services.',
  'Mon-Fri • 8:00AM-8:00PM',
  FALSE,
  'Health',
  'https://dailycollegian.com/wp-content/uploads/2020/04/20986089189_83cd4dacfc_k-900x600.jpg',
  'http://www.umass.edu/uhs/'
WHERE (SELECT COUNT(*) FROM resources) < 2;

INSERT INTO resources (title, description, hours_text, is_open, category, image_url, link_url)
SELECT 'Campus Food Pantry',
  'Free groceries and essentials for students experiencing food insecurity.',
  'Mon-Fri • 1:00PM-7:00PM',
  FALSE,
  'Food',
  'https://www.umass.edu/sites/default/files/2025-09/2025_um_EVENTS_campus_food_pantry_0079.JPG',
  'https://amherstsurvival.org/campus-pantry'
WHERE (SELECT COUNT(*) FROM resources) < 3;

INSERT INTO resources (title, description, hours_text, is_open, category, image_url, link_url)
SELECT 'IT Service Desk',
  'Technical support for campus wifi, student email, software licenses, and device troubleshooting.',
  'Mon-Fri • 8:30AM-7:00PM',
  FALSE,
  'Tech',
  'https://www.umass.edu/it/sites/default/files/styles/square_thumbnail/public/2023-09/it-help-desk.jpg',
  'https://www.umass.edu/it/'
WHERE (SELECT COUNT(*) FROM resources) < 4;
