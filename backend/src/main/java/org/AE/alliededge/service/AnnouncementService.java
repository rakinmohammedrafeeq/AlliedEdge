package org.AE.alliededge.service;

import org.AE.alliededge.model.Announcement;
import org.AE.alliededge.repository.AnnouncementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class AnnouncementService {
    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    public List<Announcement> findAllVisible() {
        return announcementRepository.findByVisibleTrueOrderByCreatedAtDesc()
                .stream()
                .filter(a -> a != null && a.getCreatedAt() != null)
                .toList();
    }

    public List<Announcement> findAll() {
        return announcementRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(a -> a != null && a.getCreatedAt() != null)
                .toList();
    }

    public Announcement create(Announcement a) {
        a.setCreatedAt(java.time.LocalDateTime.now());

        // If this is being set as welcome announcement, clear any existing welcome
        // announcement
        if (a.isWelcomeAnnouncement()) {
            announcementRepository.findByIsWelcomeAnnouncementTrue().ifPresent(existing -> {
                existing.setWelcomeAnnouncement(false);
                announcementRepository.save(existing);
            });
        }

        return announcementRepository.save(a);
    }

    // Overloaded create method for convenience
    public Announcement create(String title, String message, String adminEmail) {
        Announcement announcement = new Announcement();
        announcement.setTitle(title);
        announcement.setMessage(message);
        announcement.setCreatedAt(java.time.LocalDateTime.now());
        return announcementRepository.save(announcement);
    }

    public void delete(Long id) {
        announcementRepository.deleteById(id);
    }

    public void toggleVisibility(Long id) {
        Optional<Announcement> opt = announcementRepository.findById(id);
        if (opt.isPresent()) {
            Announcement a = opt.get();
            a.setVisible(!a.isVisible());
            announcementRepository.save(a);
        }
    }

    public void toggleWelcomeAnnouncement(Long id) {
        Optional<Announcement> opt = announcementRepository.findById(id);
        if (opt.isPresent()) {
            Announcement a = opt.get();
            boolean newWelcomeStatus = !a.isWelcomeAnnouncement();

            // If setting as welcome, clear any existing welcome announcement
            if (newWelcomeStatus) {
                announcementRepository.findByIsWelcomeAnnouncementTrue().ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        existing.setWelcomeAnnouncement(false);
                        announcementRepository.save(existing);
                    }
                });
            }

            a.setWelcomeAnnouncement(newWelcomeStatus);
            announcementRepository.save(a);
        }
    }

    public Optional<Announcement> getWelcomeAnnouncement() {
        return announcementRepository.findByIsWelcomeAnnouncementTrue();
    }

    public Optional<Announcement> findById(Long id) {
        return announcementRepository.findById(id);
    }

    /**
     * Update an existing announcement.
     *
     * Contract:
     * - Does NOT change createdAt.
     * - If isWelcomeAnnouncement is set to true, clears any other welcome announcement.
     * - Supports optional video and image replacement/removal.
     */
    public Announcement update(Long id, AnnouncementUpdateRequest req) {
        Announcement existing = announcementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Announcement not found"));

        if (req.getTitle() != null) existing.setTitle(req.getTitle());
        if (req.getMessage() != null) existing.setMessage(req.getMessage());
        if (req.getVisible() != null) existing.setVisible(req.getVisible());

        if (req.getIsWelcomeAnnouncement() != null) {
            boolean wantWelcome = Boolean.TRUE.equals(req.getIsWelcomeAnnouncement());
            if (wantWelcome) {
                announcementRepository.findByIsWelcomeAnnouncementTrue().ifPresent(other -> {
                    if (other.getId() != null && !other.getId().equals(existing.getId())) {
                        other.setWelcomeAnnouncement(false);
                        announcementRepository.save(other);
                    }
                });
            }
            existing.setWelcomeAnnouncement(wantWelcome);
        }

        // Video removal
        if (Boolean.TRUE.equals(req.getRemoveVideo()) && existing.getVideoPublicId() != null) {
            try {
                cloudinaryService.deleteVideo(existing.getVideoPublicId());
            } catch (Exception e) {
                throw new RuntimeException("Failed to delete existing video", e);
            }
            existing.setVideoUrl(null);
            existing.setVideoPublicId(null);
        }

        // Video replacement
        if (req.getVideoFile() != null && !req.getVideoFile().isEmpty()) {
            try {
                // If there was an existing video, delete it first.
                if (existing.getVideoPublicId() != null) {
                    cloudinaryService.deleteVideo(existing.getVideoPublicId());
                }
                String videoUrl = cloudinaryService.uploadVideo(req.getVideoFile(), "announcements/videos");
                String publicId = cloudinaryService.extractPublicId(videoUrl);
                existing.setVideoUrl(videoUrl);
                existing.setVideoPublicId(publicId);
            } catch (Exception e) {
                throw new RuntimeException("Failed to upload new video", e);
            }
        }

        // Images removal (remove all)
        if (Boolean.TRUE.equals(req.getRemoveImages()) && existing.getImageUrls() != null) {
            try {
                for (String url : existing.getImageUrls()) {
                    if (url == null || url.isBlank()) continue;
                    cloudinaryService.deleteMediaByUrl(url);
                }
            } catch (Exception e) {
                throw new RuntimeException("Failed to delete existing images", e);
            }
            existing.getImageUrls().clear();
        }

        // Images add
        if (req.getImageFiles() != null && !req.getImageFiles().isEmpty()) {
            if (existing.getImageUrls() == null) {
                existing.setImageUrls(new java.util.ArrayList<>());
            }
            for (var imageFile : req.getImageFiles()) {
                if (imageFile == null || imageFile.isEmpty()) continue;
                String contentType = imageFile.getContentType();
                if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
                    throw new RuntimeException("Only image files are allowed");
                }
                try {
                    String imageUrl = cloudinaryService.uploadMedia(imageFile);
                    existing.getImageUrls().add(imageUrl);
                } catch (Exception e) {
                    throw new RuntimeException("Failed to upload announcement image", e);
                }
            }
        }

        return announcementRepository.save(existing);
    }
}
