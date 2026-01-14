-- Persist all profile-page fields so they survive refresh
-- Users table additions
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter VARCHAR(255);

ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_json TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages_json TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS education_json TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability_json TEXT;

-- Project table additions for richer profile projects
ALTER TABLE project ADD COLUMN IF NOT EXISTS summary VARCHAR(1000);
ALTER TABLE project ADD COLUMN IF NOT EXISTS status VARCHAR(64);
ALTER TABLE project ADD COLUMN IF NOT EXISTS problem VARCHAR(2000);
ALTER TABLE project ADD COLUMN IF NOT EXISTS built VARCHAR(2000);
ALTER TABLE project ADD COLUMN IF NOT EXISTS role VARCHAR(255);
ALTER TABLE project ADD COLUMN IF NOT EXISTS tech_stack_json TEXT;
ALTER TABLE project ADD COLUMN IF NOT EXISTS proof_links_json TEXT;

