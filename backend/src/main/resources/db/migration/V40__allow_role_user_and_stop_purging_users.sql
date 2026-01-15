-- Reinstate support for normal end-users.
--
-- Earlier migrations (V38/V39) aggressively removed and restricted roles to only
-- ROLE_AUTHOR/ROLE_ADMIN. That breaks production for normal signups that may
-- create/login with ROLE_USER (and it also breaks local/tests).
--
-- This migration is SAFE to run on environments where V38/V39 already executed:
--  - It relaxes the role constraint to allow ROLE_USER.
--  - It does NOT delete any users.

-- Normalize legacy role spellings.
UPDATE users SET role = 'ROLE_ADMIN'  WHERE role IS NOT NULL AND UPPER(role) = 'ADMIN';
UPDATE users SET role = 'ROLE_AUTHOR' WHERE role IS NOT NULL AND UPPER(role) = 'AUTHOR';
UPDATE users SET role = 'ROLE_USER'   WHERE role IS NOT NULL AND UPPER(role) = 'USER';

-- Ensure admin flag aligns with role.
UPDATE users SET admin = TRUE  WHERE role = 'ROLE_ADMIN';
UPDATE users SET admin = FALSE WHERE role IN ('ROLE_USER','ROLE_AUTHOR');

-- Set any NULL role to ROLE_USER.
UPDATE users SET role = 'ROLE_USER' WHERE role IS NULL;

-- Drop and recreate the role constraint to allow ROLE_USER, ROLE_AUTHOR, ROLE_ADMIN.
DO $$
BEGIN
    ALTER TABLE users DROP CONSTRAINT ck_users_role_author_admin;
EXCEPTION
    WHEN undefined_object THEN
        -- no-op
END $$;

ALTER TABLE users
    ADD CONSTRAINT ck_users_role_author_admin
    CHECK (role IN ('ROLE_USER','ROLE_AUTHOR','ROLE_ADMIN'));

