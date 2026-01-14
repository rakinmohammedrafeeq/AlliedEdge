-- Add video columns to announcement table
ALTER TABLE announcement
ADD COLUMN video_url VARCHAR(500),
    ADD COLUMN video_public_id VARCHAR(200);