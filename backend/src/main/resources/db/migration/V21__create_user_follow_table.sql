-- Create user_follow table for follow/unfollow functionality
CREATE TABLE user_follow (
    id BIGSERIAL PRIMARY KEY,
    follower_id BIGINT NOT NULL,
    following_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_follow_follower FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_follow_following FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_follow_relationship UNIQUE (follower_id, following_id)
);
-- Create indexes for performance
CREATE INDEX idx_user_follow_follower ON user_follow(follower_id);
CREATE INDEX idx_user_follow_following ON user_follow(following_id);