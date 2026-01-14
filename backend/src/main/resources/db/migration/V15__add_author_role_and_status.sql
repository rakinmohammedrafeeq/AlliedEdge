-- V15__add_author_role_and_status.sql
-- Add status column for users and normalize roles to support AUTHOR role

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS status VARCHAR(32);

-- Set default status to ACTIVE where null
UPDATE users SET status = 'ACTIVE' WHERE status IS NULL;

-- Ensure role column uses ROLE_* pattern consistently
UPDATE users SET role = 'ROLE_ADMIN' WHERE admin = TRUE AND (role IS NULL OR role <> 'ROLE_ADMIN');
UPDATE users SET role = 'ROLE_USER' WHERE admin = FALSE AND (role IS NULL OR role NOT IN ('ROLE_USER','ROLE_AUTHOR','ROLE_ADMIN'));

-- NOTE: ROLE_AUTHOR is a logical role value; no separate table row is required.

