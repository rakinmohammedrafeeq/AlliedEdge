-- Add likes column to comment_reply table if not exists
ALTER TABLE comment_reply ADD COLUMN IF NOT EXISTS likes INT NOT NULL DEFAULT 0;

