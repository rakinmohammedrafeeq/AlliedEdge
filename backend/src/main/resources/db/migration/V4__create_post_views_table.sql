-- Create post_views table with unique (post_id, user_id)
CREATE TABLE IF NOT EXISTS post_views (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    viewed_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_post_views_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_views_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_post_user UNIQUE (post_id, user_id)
);
