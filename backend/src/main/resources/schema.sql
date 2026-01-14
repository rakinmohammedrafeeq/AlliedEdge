-- Ensure likes column exists on startup for PostgreSQL
ALTER TABLE IF EXISTS post ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0;
-- Ensure views column exists on startup
ALTER TABLE IF EXISTS post ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;

-- Announcements table
CREATE TABLE IF NOT EXISTS announcement (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(2000),
    created_at TIMESTAMP,
    visible BOOLEAN DEFAULT TRUE
);

-- Keep schema.sql aligned with Flyway migrations (V20, V24)
ALTER TABLE IF EXISTS announcement ADD COLUMN IF NOT EXISTS is_welcome_announcement BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE IF EXISTS announcement ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);
ALTER TABLE IF EXISTS announcement ADD COLUMN IF NOT EXISTS video_public_id VARCHAR(200);
