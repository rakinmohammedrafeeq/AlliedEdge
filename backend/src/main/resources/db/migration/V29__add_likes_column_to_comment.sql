-- Add likes column to comment table if not exists
ALTER TABLE comment ADD COLUMN IF NOT EXISTS likes INT NOT NULL DEFAULT 0;

