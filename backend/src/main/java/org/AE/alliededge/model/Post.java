package org.AE.alliededge.model;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotEmpty(message = "Title must not be empty")
    @Size(min = 5, max = 100, message = "Title must be between 5 and 100 characters")
    @Column(nullable = false)
    private String title;

    @NotEmpty(message = "Content must not be empty")
    @Column(nullable = false, length = 10000)
    private String content;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ElementCollection
    @CollectionTable(name = "post_images", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "image_url")
    private List<String> imageUrls = new ArrayList<>();

    @Column(name = "video_url")
    private String videoUrl;

    // New field to track Cloudinary video public_id so that we can delete it reliably
    @Column(name = "video_public_id")
    private String videoPublicId;

    // Transient flag used only for edit form binding to request video deletion
    @Transient
    private boolean deleteVideo;

    @Column(nullable = false)
    private int likes = 0; // synchronized with PostLike count

    // New field to track views
    @Column(nullable = false)
    private int views = 0;

    // Denormalized author metadata for UI
    @Column(name = "author_name")
    private String authorName;

    @Column(name = "author_is_admin", nullable = false)
    private boolean authorIsAdmin = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments;

    public Post() {
    }

    public int getLikes() { return likes; }
    public void setLikes(int likes) { this.likes = likes; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public List<Comment> getComments() { return comments; }
    public void setComments(List<Comment> comments) { this.comments = comments; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    // New getters/setters for multiple image URLs
    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    // Getter/Setter for Cloudinary video public_id
    public String getVideoPublicId() {
        return videoPublicId;
    }

    public void setVideoPublicId(String videoPublicId) {
        this.videoPublicId = videoPublicId;
    }

    // Getter/Setter for transient deleteVideo flag
    public boolean isDeleteVideo() {
        return deleteVideo;
    }

    public void setDeleteVideo(boolean deleteVideo) {
        this.deleteVideo = deleteVideo;
    }

    // Getter/Setter for views
    public int getViews() { return views; }
    public void setViews(int views) { this.views = views; }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public boolean isAuthorIsAdmin() {
        return authorIsAdmin;
    }

    public void setAuthorIsAdmin(boolean authorIsAdmin) {
        this.authorIsAdmin = authorIsAdmin;
    }
}
