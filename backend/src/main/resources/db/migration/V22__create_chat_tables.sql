-- Create chat_room table
CREATE TABLE chat_room (
    id BIGSERIAL PRIMARY KEY,
    user1_id BIGINT NOT NULL,
    user2_id BIGINT NOT NULL,
    CONSTRAINT fk_chat_room_user1 FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_room_user2 FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Create chat_message table
CREATE TABLE chat_message (
    id BIGSERIAL PRIMARY KEY,
    chat_room_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_message_room FOREIGN KEY (chat_room_id) REFERENCES chat_room(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Create indexes for performance
CREATE INDEX idx_chat_room_user1 ON chat_room(user1_id);
CREATE INDEX idx_chat_room_user2 ON chat_room(user2_id);
CREATE INDEX idx_chat_message_room ON chat_message(chat_room_id);
CREATE INDEX idx_chat_message_sender ON chat_message(sender_id);
CREATE INDEX idx_chat_message_timestamp ON chat_message(timestamp);