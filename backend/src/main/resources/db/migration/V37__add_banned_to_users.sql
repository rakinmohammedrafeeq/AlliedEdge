-- Add banned flag to users so admins can prevent logins
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT FALSE;

