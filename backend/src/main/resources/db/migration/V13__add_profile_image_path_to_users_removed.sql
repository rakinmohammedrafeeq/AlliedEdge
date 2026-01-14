-- This migration is intentionally left empty.
-- Previously there was a duplicate V12 migration adding profile_image_path.
-- The logic has been merged into V12__add_user_profile_fields.sql to keep schema consistent.
-- This placeholder exists only so that if any environment had already tried to reference
-- a later version, Flyway will not fail due to missing files.

