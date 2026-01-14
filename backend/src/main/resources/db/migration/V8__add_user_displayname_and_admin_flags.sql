ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill display_name with username where null
UPDATE users SET display_name = username WHERE display_name IS NULL;

-- Mark known admin emails as admin=true (in case they already exist)
UPDATE users SET admin = TRUE
WHERE LOWER(username) IN (
    'rayanmohammedrafeeq@gmail.com',
    'rakinmohammedrafeeq@gmail.com'
);
