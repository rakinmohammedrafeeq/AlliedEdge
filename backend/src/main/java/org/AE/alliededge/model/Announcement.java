package org.AE.alliededge.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.*;

@Entity
public class Announcement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 2000)
    private String message;

    private LocalDateTime createdAt;

    private boolean visible;

    @Column(name = "is_welcome_announcement")
    private boolean isWelcomeAnnouncement = false;

    @Column(name = "video_url")
    private String videoUrl;

    @Column(name = "video_public_id")
    private String videoPublicId;

    @ElementCollection
    @CollectionTable(name = "announcement_images", joinColumns = @JoinColumn(name = "announcement_id"))
    @Column(name = "image_url", length = 1000)
    private List<String> imageUrls = new ArrayList<>();

    // Constructors
    public Announcement() {
        this.visible = true;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isVisible() {
        return visible;
    }

    public void setVisible(boolean visible) {
        this.visible = visible;
    }

    public boolean isWelcomeAnnouncement() {
        return isWelcomeAnnouncement;
    }

    public void setWelcomeAnnouncement(boolean welcomeAnnouncement) {
        isWelcomeAnnouncement = welcomeAnnouncement;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public String getVideoPublicId() {
        return videoPublicId;
    }

    public void setVideoPublicId(String videoPublicId) {
        this.videoPublicId = videoPublicId;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }
}
