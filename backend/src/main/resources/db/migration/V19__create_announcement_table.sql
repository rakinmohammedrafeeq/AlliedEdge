-- V19__create_announcement_table.sql
CREATE TABLE IF NOT EXISTS announcement (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(2000),
    created_at TIMESTAMP,
    visible BOOLEAN DEFAULT TRUE
);

