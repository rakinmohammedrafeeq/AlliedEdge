package org.AE.alliededge.dto;

import java.time.LocalDateTime;

public class ChatMessageDTO {
    private Long roomId;
    private String senderUsername;
    private String senderDisplayName;
    private String content;
    private LocalDateTime timestamp;

    public ChatMessageDTO() {
    }

    public ChatMessageDTO(Long roomId, String senderUsername, String senderDisplayName, String content,
            LocalDateTime timestamp) {
        this.roomId = roomId;
        this.senderUsername = senderUsername;
        this.senderDisplayName = senderDisplayName;
        this.content = content;
        this.timestamp = timestamp;
    }

    // Getters and Setters

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getSenderUsername() {
        return senderUsername;
    }

    public void setSenderUsername(String senderUsername) {
        this.senderUsername = senderUsername;
    }

    public String getSenderDisplayName() {
        return senderDisplayName;
    }

    public void setSenderDisplayName(String senderDisplayName) {
        this.senderDisplayName = senderDisplayName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
