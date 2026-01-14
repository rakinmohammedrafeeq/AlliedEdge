package org.AE.alliededge.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Stable DTO for post detail view.
 * Avoids exposing JPA entities directly (prevents lazy proxy / serialization issues).
 */
public class PostDetailDto {
    private Long id;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private int likes;
    private int views;
    private List<String> imageUrls;
    private String videoUrl;

    private AuthorDto author;
    private List<CommentViewDto> comments;

    public static class AuthorDto {
        private Long id;
        private String username;
        private String displayName;
        private String profileImageUrl;
        private boolean admin;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }

        public String getProfileImageUrl() { return profileImageUrl; }
        public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

        public boolean isAdmin() { return admin; }
        public void setAdmin(boolean admin) { this.admin = admin; }
    }

    public static class CommentReplyViewDto {
        private Long id;
        private String content;
        private java.time.LocalDateTime createdAt;
        private AuthorDto author;
        private int likes;
        private boolean likedByMe;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }

        public java.time.LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }

        public AuthorDto getAuthor() { return author; }
        public void setAuthor(AuthorDto author) { this.author = author; }

        public int getLikes() { return likes; }
        public void setLikes(int likes) { this.likes = likes; }

        public boolean isLikedByMe() { return likedByMe; }
        public void setLikedByMe(boolean likedByMe) { this.likedByMe = likedByMe; }
    }

    public static class CommentViewDto {
        private Long id;
        private String content;
        private LocalDateTime createdAt;
        private AuthorDto author;
        private List<CommentReplyViewDto> replies;
        private int likes;
        private boolean likedByMe;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

        public AuthorDto getAuthor() { return author; }
        public void setAuthor(AuthorDto author) { this.author = author; }

        public List<CommentReplyViewDto> getReplies() { return replies; }
        public void setReplies(List<CommentReplyViewDto> replies) { this.replies = replies; }

        public int getLikes() { return likes; }
        public void setLikes(int likes) { this.likes = likes; }

        public boolean isLikedByMe() { return likedByMe; }
        public void setLikedByMe(boolean likedByMe) { this.likedByMe = likedByMe; }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public int getLikes() { return likes; }
    public void setLikes(int likes) { this.likes = likes; }

    public int getViews() { return views; }
    public void setViews(int views) { this.views = views; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    public AuthorDto getAuthor() { return author; }
    public void setAuthor(AuthorDto author) { this.author = author; }

    public List<CommentViewDto> getComments() { return comments; }
    public void setComments(List<CommentViewDto> comments) { this.comments = comments; }
}

