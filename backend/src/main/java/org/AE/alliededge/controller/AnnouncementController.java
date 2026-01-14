package org.AE.alliededge.controller;

import org.AE.alliededge.model.Announcement;
import org.AE.alliededge.service.AnnouncementService;
import org.AE.alliededge.service.CloudinaryService;
import org.AE.alliededge.service.AnnouncementUpdateRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AnnouncementController {
    @Autowired
    private AnnouncementService announcementService;

    @Autowired
    private CloudinaryService cloudinaryService;

    // Public: List all visible announcements
    @GetMapping("/announcements")
    public List<Announcement> announcements() {
        return announcementService.findAllVisible();
    }

    // Admin: List all announcements
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/announcements")
    public List<Announcement> adminAnnouncements() {
        return announcementService.findAll();
    }

    // Admin: Create new announcement (supports optional videoFile)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/announcements")
    public ResponseEntity<Announcement> createAnnouncement(
            @ModelAttribute Announcement announcement,
            @RequestParam(value = "imageFiles", required = false) List<MultipartFile> imageFiles,
            @RequestParam(value = "imageFiles[]", required = false) List<MultipartFile> imageFilesAlt,
            @RequestParam(value = "videoFile", required = false) MultipartFile videoFile) {
        try {
            if ((imageFiles == null || imageFiles.isEmpty()) && imageFilesAlt != null && !imageFilesAlt.isEmpty()) {
                imageFiles = imageFilesAlt;
            }

            if (announcement.getImageUrls() == null) {
                announcement.setImageUrls(new java.util.ArrayList<>());
            }

            if (imageFiles != null && !imageFiles.isEmpty()) {
                for (MultipartFile imageFile : imageFiles) {
                    if (imageFile == null || imageFile.isEmpty()) continue;
                    String contentType = imageFile.getContentType();
                    if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
                        throw new RuntimeException("Only image files are allowed");
                    }
                    String imageUrl = cloudinaryService.uploadMedia(imageFile);
                    announcement.getImageUrls().add(imageUrl);
                }
            }

            if (videoFile != null && !videoFile.isEmpty()) {
                String videoUrl = cloudinaryService.uploadVideo(videoFile, "announcements/videos");
                String publicId = cloudinaryService.extractPublicId(videoUrl);
                announcement.setVideoUrl(videoUrl);
                announcement.setVideoPublicId(publicId);
            }

            Announcement created = announcementService.create(announcement);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create announcement: " + e.getMessage(), e);
        }
    }

    // Admin: Delete announcement
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/announcements/{id}")
    public Map<String, Object> deleteAnnouncement(@PathVariable Long id) {
        announcementService.delete(id);
        return Map.of("message", "Deleted");
    }

    // Admin: Toggle visibility
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/announcements/{id}/toggle")
    public Map<String, Object> toggleVisibility(@PathVariable Long id) {
        announcementService.toggleVisibility(id);
        return Map.of("message", "Toggled" );
    }

    // Admin: Toggle welcome announcement status
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/announcements/{id}/toggle-welcome")
    public Map<String, Object> toggleWelcomeAnnouncement(@PathVariable Long id) {
        announcementService.toggleWelcomeAnnouncement(id);
        return Map.of("message", "Toggled" );
    }

    // Admin: Get announcement by id
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/announcements/{id}")
    public Announcement getAnnouncement(@PathVariable Long id) {
        return announcementService.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));
    }

    // Admin: Update announcement (with optional video changes)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/announcements/{id}")
    public Announcement editAnnouncement(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "message", required = false) String message,
            @RequestParam(value = "visible", required = false) Boolean visible,
            @RequestParam(value = "isWelcomeAnnouncement", required = false) Boolean isWelcomeAnnouncement,
            @RequestParam(value = "welcomeAnnouncement", required = false) Boolean welcomeAnnouncement,
            @RequestParam(value = "imageFiles", required = false) List<MultipartFile> imageFiles,
            @RequestParam(value = "imageFiles[]", required = false) List<MultipartFile> imageFilesAlt,
            @RequestParam(value = "removeImages", required = false) Boolean removeImages,
            @RequestParam(value = "videoFile", required = false) MultipartFile videoFile,
            @RequestParam(value = "removeVideo", required = false) Boolean removeVideo) {

        if ((imageFiles == null || imageFiles.isEmpty()) && imageFilesAlt != null && !imageFilesAlt.isEmpty()) {
            imageFiles = imageFilesAlt;
        }

        AnnouncementUpdateRequest req = new AnnouncementUpdateRequest();
        req.setTitle(title);
        req.setMessage(message);
        req.setVisible(visible);
        // accept both param names for compatibility with older forms
        req.setIsWelcomeAnnouncement(isWelcomeAnnouncement != null ? isWelcomeAnnouncement : welcomeAnnouncement);
        req.setImageFiles(imageFiles);
        req.setRemoveImages(removeImages);
        req.setVideoFile(videoFile);
        req.setRemoveVideo(removeVideo);

        return announcementService.update(id, req);
    }

    // Admin: Create announcement via create form equivalent (kept for compatibility)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/announcements/create")
    public ResponseEntity<Announcement> createAnnouncementForm(@ModelAttribute Announcement announcement,
                                                              @RequestParam(value = "imageFiles", required = false) List<MultipartFile> imageFiles,
                                                              @RequestParam(value = "imageFiles[]", required = false) List<MultipartFile> imageFilesAlt,
                                                              @RequestParam(value = "videoFile", required = false) MultipartFile videoFile) {
        try {
            if ((imageFiles == null || imageFiles.isEmpty()) && imageFilesAlt != null && !imageFilesAlt.isEmpty()) {
                imageFiles = imageFilesAlt;
            }

            if (announcement.getImageUrls() == null) {
                announcement.setImageUrls(new java.util.ArrayList<>());
            }

            if (imageFiles != null && !imageFiles.isEmpty()) {
                for (MultipartFile imageFile : imageFiles) {
                    if (imageFile == null || imageFile.isEmpty()) continue;
                    String contentType = imageFile.getContentType();
                    if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
                        throw new RuntimeException("Only image files are allowed");
                    }
                    String imageUrl = cloudinaryService.uploadMedia(imageFile);
                    announcement.getImageUrls().add(imageUrl);
                }
            }

            if (videoFile != null && !videoFile.isEmpty()) {
                String videoUrl = cloudinaryService.uploadVideo(videoFile, "announcements/videos");
                String publicId = cloudinaryService.extractPublicId(videoUrl);
                announcement.setVideoUrl(videoUrl);
                announcement.setVideoPublicId(publicId);
            }

            announcement.setCreatedAt(java.time.LocalDateTime.now());
            announcement.setVisible(true);
            Announcement created = announcementService.create(announcement);

            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create announcement: " + e.getMessage(), e);
        }
    }

    // Admin: Delete video from announcement
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/announcements/{id}/delete-video")
    public Announcement deleteAnnouncementVideo(@PathVariable Long id) {
        try {
            Announcement announcement = announcementService.findById(id)
                    .orElseThrow(() -> new RuntimeException("Announcement not found"));

            if (announcement.getVideoPublicId() != null) {
                cloudinaryService.deleteVideo(announcement.getVideoPublicId());
                announcement.setVideoUrl(null);
                announcement.setVideoPublicId(null);

                AnnouncementUpdateRequest req = new AnnouncementUpdateRequest();
                req.setRemoveVideo(true);
                return announcementService.update(id, req);
            }

            return announcement;
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete video: " + e.getMessage(), e);
        }
    }
}
