-- Add welcome announcement support and first login tracking
-- Add is_welcome_announcement column to announcement table
ALTER TABLE announcement
ADD COLUMN IF NOT EXISTS is_welcome_announcement BOOLEAN NOT NULL DEFAULT FALSE;
-- Add first_login column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_login BOOLEAN NOT NULL DEFAULT TRUE;
-- Add comment for documentation
COMMENT ON COLUMN announcement.is_welcome_announcement IS 'Marks if this is the welcome announcement shown to first-time users';
COMMENT ON COLUMN users.first_login IS 'Tracks if this is the users first login to show welcome announcement';