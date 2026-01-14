-- Create user skills table
CREATE TABLE user_skills (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skills VARCHAR(100)
);
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);