package org.AE.alliededge.service;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;

/**
 * Contract for updating an Announcement from the REST API.
 * We keep this separate from the JPA entity to avoid accidentally resetting immutable fields
 * like createdAt.
 */
public class AnnouncementUpdateRequest {
    private String title;
    private String message;
    private Boolean visible;
    private Boolean isWelcomeAnnouncement;

    /** Optional: replace the existing video when provided. */
    private MultipartFile videoFile;

    /** Optional: set true to remove the existing video. */
    private Boolean removeVideo;

    /** Optional: add additional images. */
    private List<MultipartFile> imageFiles;

    /** Optional: set true to remove all existing images. */
    private Boolean removeImages;

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

    public Boolean getVisible() {
        return visible;
    }

    public void setVisible(Boolean visible) {
        this.visible = visible;
    }

    public Boolean getIsWelcomeAnnouncement() {
        return isWelcomeAnnouncement;
    }

    public void setIsWelcomeAnnouncement(Boolean welcomeAnnouncement) {
        isWelcomeAnnouncement = welcomeAnnouncement;
    }

    public MultipartFile getVideoFile() {
        return videoFile;
    }

    public void setVideoFile(MultipartFile videoFile) {
        this.videoFile = videoFile;
    }

    public Boolean getRemoveVideo() {
        return removeVideo;
    }

    public void setRemoveVideo(Boolean removeVideo) {
        this.removeVideo = removeVideo;
    }

    public List<MultipartFile> getImageFiles() {
        return imageFiles;
    }

    public void setImageFiles(List<MultipartFile> imageFiles) {
        this.imageFiles = imageFiles;
    }

    public Boolean getRemoveImages() {
        return removeImages;
    }

    public void setRemoveImages(Boolean removeImages) {
        this.removeImages = removeImages;
    }
}
