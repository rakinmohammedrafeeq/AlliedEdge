-- V14: Add missing profile_image_path column (previous edits to V12 caused mismatch so we add a new migration)
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_path VARCHAR(512);

