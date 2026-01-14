-- Create comment replies table
CREATE TABLE IF NOT EXISTS comment_reply (
    id BIGSERIAL PRIMARY KEY,
    content VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    comment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_reply_comment FOREIGN KEY (comment_id) REFERENCES comment(id) ON DELETE CASCADE,
    CONSTRAINT fk_reply_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comment_reply_comment_id ON comment_reply(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reply_user_id ON comment_reply(user_id);

