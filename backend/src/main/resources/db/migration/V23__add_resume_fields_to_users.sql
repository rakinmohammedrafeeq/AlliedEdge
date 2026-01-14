-- Add resume upload fields to users table
ALTER TABLE users
ADD COLUMN resume_url VARCHAR(512);
ALTER TABLE users
ADD COLUMN resume_public_id VARCHAR(255);