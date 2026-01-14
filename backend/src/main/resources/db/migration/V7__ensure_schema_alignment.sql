-- Ensure post has user_id column
ALTER TABLE post ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- Ensure foreign key from post.user_id to users(id)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name='post' AND constraint_name='fk_post_user'
    ) THEN
        ALTER TABLE post ADD CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Backfill created_at if null
UPDATE post SET created_at = NOW() WHERE created_at IS NULL;

-- Ensure comment table exists
CREATE TABLE IF NOT EXISTS comment (
    id BIGSERIAL PRIMARY KEY,
    content VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

