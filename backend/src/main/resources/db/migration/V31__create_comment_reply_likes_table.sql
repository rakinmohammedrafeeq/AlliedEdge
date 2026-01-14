-- Create comment reply likes table
CREATE TABLE IF NOT EXISTS comment_reply_likes (
    id BIGSERIAL PRIMARY KEY,
    reply_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_comment_reply_likes_reply FOREIGN KEY (reply_id) REFERENCES comment_reply(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_reply_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_comment_reply_likes UNIQUE (reply_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_reply_likes_reply_id ON comment_reply_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_comment_reply_likes_user_id ON comment_reply_likes(user_id);

