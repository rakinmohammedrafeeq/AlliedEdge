-- Add announcement images table
CREATE TABLE IF NOT EXISTS announcement_images (
    announcement_id BIGINT NOT NULL,
    image_url VARCHAR(1000) NOT NULL,
    CONSTRAINT fk_announcement_images_announcement
        FOREIGN KEY (announcement_id) REFERENCES announcement(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_announcement_images_announcement_id
    ON announcement_images(announcement_id);

