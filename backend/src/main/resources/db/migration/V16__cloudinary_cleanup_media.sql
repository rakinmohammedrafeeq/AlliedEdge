-- Cleanup legacy local upload paths and align column names for Cloudinary URLs

-- 1) Null out any legacy local filesystem paths so the app doesn't try to use /uploads/**
DO $$
BEGIN
    -- Only run if table "post" exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'post'
    ) THEN
        UPDATE post
        SET video_path = NULL
        WHERE (video_path LIKE '/uploads/%'
            OR video_path LIKE 'file:%'
            OR video_path LIKE 'C:%'
            OR video_path LIKE '%\\uploads\\%')
          AND video_path IS NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    -- Only run if table "post_images" exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'post_images'
    ) THEN
        UPDATE post_images
        SET image_path = NULL
        WHERE (image_path LIKE '/uploads/%'
            OR image_path LIKE 'file:%'
            OR image_path LIKE 'C:%'
            OR image_path LIKE '%\\uploads\\%')
          AND image_path IS NOT NULL;
    END IF;
END $$;

-- 2) Rename columns to reflect that they now store Cloudinary URLs (idempotent)
DO $$
BEGIN
    -- Rename post.video_path -> post.video_url if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'post'
          AND column_name = 'video_path'
    )
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'post'
          AND column_name = 'video_url'
    ) THEN
        ALTER TABLE post RENAME COLUMN video_path TO video_url;
    END IF;
END $$;

DO $$
BEGIN
    -- Rename post_images.image_path -> post_images.image_url if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'post_images'
          AND column_name = 'image_path'
    )
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'post_images'
          AND column_name = 'image_url'
    ) THEN
        ALTER TABLE post_images RENAME COLUMN image_path TO image_url;
    END IF;
END $$;
