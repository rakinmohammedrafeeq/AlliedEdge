package org.AE.alliededge.dto;

import java.time.LocalDateTime;

public class ChatRoomDTO {
    private Long roomId;
    private Long otherUserId;
    private String otherUserUsername;
    private String otherUserDisplayName;
    private String otherUserProfileImage;
    private String lastMessage;
    private LocalDateTime lastMessageTime;

    public ChatRoomDTO() {
    }

    public ChatRoomDTO(Long roomId, Long otherUserId, String otherUserUsername, String otherUserDisplayName,
            String otherUserProfileImage, String lastMessage, LocalDateTime lastMessageTime) {
        this.roomId = roomId;
        this.otherUserId = otherUserId;
        this.otherUserUsername = otherUserUsername;
        this.otherUserDisplayName = otherUserDisplayName;
        this.otherUserProfileImage = otherUserProfileImage;
        this.lastMessage = lastMessage;
        this.lastMessageTime = lastMessageTime;
    }

    // Getters and Setters

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public Long getOtherUserId() {
        return otherUserId;
    }

    public void setOtherUserId(Long otherUserId) {
        this.otherUserId = otherUserId;
    }

    public String getOtherUserUsername() {
        return otherUserUsername;
    }

    public void setOtherUserUsername(String otherUserUsername) {
        this.otherUserUsername = otherUserUsername;
    }

    public String getOtherUserDisplayName() {
        return otherUserDisplayName;
    }

    public void setOtherUserDisplayName(String otherUserDisplayName) {
        this.otherUserDisplayName = otherUserDisplayName;
    }

    public String getOtherUserProfileImage() {
        return otherUserProfileImage;
    }

    public void setOtherUserProfileImage(String otherUserProfileImage) {
        this.otherUserProfileImage = otherUserProfileImage;
    }

    public String getLastMessage() {
        return lastMessage;
    }

    public void setLastMessage(String lastMessage) {
        this.lastMessage = lastMessage;
    }

    public LocalDateTime getLastMessageTime() {
        return lastMessageTime;
    }

    public void setLastMessageTime(LocalDateTime lastMessageTime) {
        this.lastMessageTime = lastMessageTime;
    }
}
