-- Enforce that only ROLE_AUTHOR and ROLE_ADMIN can exist in users.role.
--
-- This is a hard DB guard to prevent accidental insertion of ROLE_USER/other roles.

-- Normalize legacy values one last time (safety for environments that skipped earlier seed scripts).
UPDATE users SET role = 'ROLE_ADMIN'  WHERE role IS NOT NULL AND UPPER(role) = 'ADMIN';
UPDATE users SET role = 'ROLE_AUTHOR' WHERE role IS NOT NULL AND UPPER(role) = 'AUTHOR';
-- Treat NULL as a normal user role.
UPDATE users SET role = 'ROLE_USER' WHERE role IS NULL;

-- Drop any previous role constraint if present (idempotent-ish via exception swallowing in DO block).
DO $$
BEGIN
    ALTER TABLE users DROP CONSTRAINT ck_users_role_author_admin;
EXCEPTION
    WHEN undefined_object THEN
        -- no-op
END $$;

-- Allow ROLE_USER as well as author/admin.
ALTER TABLE users
    ADD CONSTRAINT ck_users_role_author_admin
    CHECK (role IN ('ROLE_USER','ROLE_AUTHOR','ROLE_ADMIN'));
