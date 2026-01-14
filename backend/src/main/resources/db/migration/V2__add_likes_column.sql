-- Add likes column to post table if not exists
ALTER TABLE post ADD COLUMN IF NOT EXISTS likes INT NOT NULL DEFAULT 0;
