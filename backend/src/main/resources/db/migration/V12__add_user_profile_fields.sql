-- Add optional profile fields to users table for profile/bio/social links
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(512);
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS github VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(512);
-- New column storing local profile image path used by the app
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_path VARCHAR(512);
