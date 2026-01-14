-- Add banner image URL for user profiles
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_image_url VARCHAR(512);

