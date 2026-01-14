package org.AE.alliededge.dto;

import java.time.Instant;

/**
 * Lightweight realtime payload for post counters.
 * Sent over STOMP to: /topic/posts/{postId}
 */
public class PostStatsDto {
    private Long postId;
    private Integer likes;
    private Integer commentCount;
    private Instant updatedAt;

    public PostStatsDto() {
    }

    public PostStatsDto(Long postId, Integer likes, Integer commentCount, Instant updatedAt) {
        this.postId = postId;
        this.likes = likes;
        this.commentCount = commentCount;
        this.updatedAt = updatedAt;
    }

    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }

    public Integer getLikes() {
        return likes;
    }

    public void setLikes(Integer likes) {
        this.likes = likes;
    }

    public Integer getCommentCount() {
        return commentCount;
    }

    public void setCommentCount(Integer commentCount) {
        this.commentCount = commentCount;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

