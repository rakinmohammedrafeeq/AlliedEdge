-- Ensure Cloudinary video metadata columns exist on post table

DO $$
BEGIN
    -- Only run if table "post" exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'post'
    ) THEN
        -- Add video_url column if it does not exist (Cloudinary URL)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'post'
              AND column_name = 'video_url'
        ) THEN
            ALTER TABLE post ADD COLUMN video_url VARCHAR(1024);
        END IF;

        -- Add video_public_id column if it does not exist (Cloudinary public_id)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'post'
              AND column_name = 'video_public_id'
        ) THEN
            ALTER TABLE post ADD COLUMN video_public_id VARCHAR(255);
        END IF;
    END IF;
END $$;
