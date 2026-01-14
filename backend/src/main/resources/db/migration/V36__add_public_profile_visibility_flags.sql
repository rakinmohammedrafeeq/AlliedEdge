-- Public profile visibility flags
-- Default: keep sensitive fields private unless user explicitly opts-in.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS show_email_on_profile BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS show_resume_on_profile BOOLEAN NOT NULL DEFAULT FALSE;
