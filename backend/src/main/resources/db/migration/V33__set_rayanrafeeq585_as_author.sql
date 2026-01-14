-- V16__set_rayanrafeeq585_as_author.sql
-- Ensure rayanrafeeq585@gmail.com has AUTHOR privileges but is not ADMIN.
--
-- NOTE: This uses users.email as the canonical identifier for Google/OAuth users.

UPDATE users
SET role = 'ROLE_AUTHOR',
    admin = FALSE
WHERE LOWER(email) = 'rayanrafeeq585@gmail.com';

