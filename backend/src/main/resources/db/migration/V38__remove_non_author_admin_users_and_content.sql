-- Remove any non-author/admin users and their related content.
--
-- Only two user roles should exist in the DB moving forward:
--   - ROLE_AUTHOR
--   - ROLE_ADMIN
--
-- This migration deletes users that are not one of those roles, including their
-- related posts/comments/likes/etc. The deletes are ordered defensively to
-- satisfy foreign keys even if some environments don't have ON DELETE CASCADE.

-- Normalize known legacy role spellings to ROLE_*.
UPDATE users SET role = 'ROLE_ADMIN'  WHERE role IS NOT NULL AND UPPER(role) = 'ADMIN';
UPDATE users SET role = 'ROLE_AUTHOR' WHERE role IS NOT NULL AND UPPER(role) = 'AUTHOR';
UPDATE users SET role = 'ROLE_USER'   WHERE role IS NOT NULL AND UPPER(role) = 'USER';

-- Ensure "admin" flag aligns with admin role.
UPDATE users SET admin = TRUE WHERE role = 'ROLE_ADMIN';

-- Collect users to delete once.
CREATE TEMP TABLE tmp_users_to_delete AS
SELECT id
FROM users
WHERE role IS NULL OR role NOT IN ('ROLE_AUTHOR','ROLE_ADMIN');

-- If nothing to do, we're done.
-- (Temp table will still exist, which is fine for the tx.)

-- =========================
-- Remove relationship tables
-- =========================

-- User follow relationships (both follower and following).
DELETE FROM user_follow
WHERE follower_id IN (SELECT id FROM tmp_users_to_delete)
   OR following_id IN (SELECT id FROM tmp_users_to_delete);

-- Chat tables (chat_message -> chat_room, but rooms also reference users).
-- Delete messages first to be safe (even though chat_room likely cascades).
DELETE FROM chat_message
WHERE sender_id IN (SELECT id FROM tmp_users_to_delete);

DELETE FROM chat_room
WHERE user1_id IN (SELECT id FROM tmp_users_to_delete)
   OR user2_id IN (SELECT id FROM tmp_users_to_delete);

-- =========================
-- Remove post/comment graph
-- =========================

-- Build the set of posts authored by users-to-delete.
CREATE TEMP TABLE tmp_posts_to_delete AS
SELECT p.id
FROM post p
WHERE p.user_id IN (SELECT id FROM tmp_users_to_delete);

-- Build the set of comments under those posts.
CREATE TEMP TABLE tmp_comments_to_delete AS
SELECT c.id
FROM comment c
WHERE c.post_id IN (SELECT id FROM tmp_posts_to_delete);

-- Comment reply likes -> comment replies -> comment likes -> comments.
DELETE FROM comment_reply_likes
WHERE user_id IN (SELECT id FROM tmp_users_to_delete)
   OR reply_id IN (
       SELECT cr.id FROM comment_reply cr WHERE cr.comment_id IN (SELECT id FROM tmp_comments_to_delete)
   );

DELETE FROM comment_likes
WHERE user_id IN (SELECT id FROM tmp_users_to_delete)
   OR comment_id IN (SELECT id FROM tmp_comments_to_delete);

DELETE FROM comment_reply
WHERE user_id IN (SELECT id FROM tmp_users_to_delete)
   OR comment_id IN (SELECT id FROM tmp_comments_to_delete);

-- Some schemas may also have direct user-owned comments on other posts.
DELETE FROM comment
WHERE user_id IN (SELECT id FROM tmp_users_to_delete)
   OR post_id IN (SELECT id FROM tmp_posts_to_delete);

-- Post likes/views before posts.
DELETE FROM post_likes
WHERE user_id IN (SELECT id FROM tmp_users_to_delete)
   OR post_id IN (SELECT id FROM tmp_posts_to_delete);

DELETE FROM post_views
WHERE user_id IN (SELECT id FROM tmp_users_to_delete)
   OR post_id IN (SELECT id FROM tmp_posts_to_delete);

-- Posts.
DELETE FROM post
WHERE id IN (SELECT id FROM tmp_posts_to_delete)
   OR user_id IN (SELECT id FROM tmp_users_to_delete);

-- =========================
-- Other user-owned content
-- =========================

DELETE FROM project
WHERE user_id IN (SELECT id FROM tmp_users_to_delete);

DELETE FROM user_skills
WHERE user_id IN (SELECT id FROM tmp_users_to_delete);

-- =========================
-- Finally delete the users
-- =========================

DELETE FROM users
WHERE id IN (SELECT id FROM tmp_users_to_delete);

-- Clean up temp tables.
DROP TABLE IF EXISTS tmp_comments_to_delete;
DROP TABLE IF EXISTS tmp_posts_to_delete;
DROP TABLE IF EXISTS tmp_users_to_delete;
