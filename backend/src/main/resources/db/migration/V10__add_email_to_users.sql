-- Add canonical email column to users and backfill from existing username values where they look like emails
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Backfill: if username contains '@', assume it's an email
UPDATE users SET email = username WHERE email IS NULL AND username LIKE '%@%';

-- For any remaining rows without email, you may want to set a placeholder or handle manually.
-- Here we default to username plus a fake domain to satisfy NOT NULL, but you can adjust as needed.
UPDATE users SET email = CONCAT(username, '@local.invalid') WHERE email IS NULL;

-- Enforce NOT NULL and uniqueness
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT uk_users_email UNIQUE (email);

