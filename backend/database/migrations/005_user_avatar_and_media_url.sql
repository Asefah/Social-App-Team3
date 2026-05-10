-- Profile photo URL; longer URLs for uploaded gallery images.

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

ALTER TABLE user_images
  ALTER COLUMN image_url TYPE VARCHAR(500);
