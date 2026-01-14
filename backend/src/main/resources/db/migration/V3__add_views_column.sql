-- Add views column to post table if not exists
ALTER TABLE post ADD COLUMN IF NOT EXISTS views INT NOT NULL DEFAULT 0;
