ALTER TABLE post ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);
ALTER TABLE post ADD COLUMN IF NOT EXISTS author_is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill post.author_name from users.display_name (or username) using user_id FK
UPDATE post p
SET author_name = COALESCE(u.display_name, u.username)
FROM users u
WHERE p.user_id = u.id AND p.author_name IS NULL;

-- Backfill author_is_admin based on users.admin flag or ADMIN role
UPDATE post p
SET author_is_admin = TRUE
FROM users u
WHERE p.user_id = u.id
  AND (u.admin = TRUE OR UPPER(u.role) = 'ADMIN');

