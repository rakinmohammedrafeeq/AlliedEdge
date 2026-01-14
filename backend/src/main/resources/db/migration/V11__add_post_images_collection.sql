-- Create table to store multiple image paths per post
CREATE TABLE IF NOT EXISTS post_images (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    CONSTRAINT fk_post_images_post FOREIGN KEY (post_id)
        REFERENCES post(id) ON DELETE CASCADE
);

-- Optional migration step: copy existing single image_path into collection table
INSERT INTO post_images (post_id, image_path)
SELECT id AS post_id, image_path
FROM post
WHERE image_path IS NOT NULL AND image_path <> ''
ON CONFLICT DO NOTHING;

