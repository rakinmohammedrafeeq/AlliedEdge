package org.AE.alliededge.service;

import org.AE.alliededge.model.User;
import org.springframework.web.multipart.MultipartFile;

public interface ProfileService {

    /**
     * Resolve the currently authenticated user based on the Spring Security principal (email).
     *
     * @return the current User
     * @throws IllegalStateException if the authentication is missing or the user cannot be found
     */
    User getCurrentUser();

    /**
     * Update editable profile fields for the given user.
     * Admin users cannot change username or email via this method.
     */
    void updateProfile(User user,
                       String displayName,
                       String bio,
                       String linkedin,
                       String github,
                       String website,
                       String location,
                       String twitter,
                       String skillsJson,
                       String projectsJson,
                       String experienceJson,
                       String languagesJson,
                       String educationJson,
                       String availabilityJson,
                       Boolean showEmailOnProfile,
                       Boolean showResumeOnProfile);

    /**
     * Update the username for a regular (non-admin) user.
     * Validation (uniqueness, format, etc.) is delegated to UserService.
     */
    void updateUsernameForUser(User user, String newUsername);

    /**
     * Compute admin-specific post statistics for the given admin user.
     */
    AdminPostStats calculateAdminPostStats(User adminUser);

    /**
     * Simple DTO for aggregated admin post statistics.
     */
    class AdminPostStats {
        private long totalPosts;
        private long totalLikes;
        private long totalComments;
        private long totalViews;

        public long getTotalPosts() {
            return totalPosts;
        }

        public void setTotalPosts(long totalPosts) {
            this.totalPosts = totalPosts;
        }

        public long getTotalLikes() {
            return totalLikes;
        }

        public void setTotalLikes(long totalLikes) {
            this.totalLikes = totalLikes;
        }

        public long getTotalComments() {
            return totalComments;
        }

        public void setTotalComments(long totalComments) {
            this.totalComments = totalComments;
        }

        public long getTotalViews() {
            return totalViews;
        }

        public void setTotalViews(long totalViews) {
            this.totalViews = totalViews;
        }
    }

    // New API for profile image uploads via Cloudinary
    /**
     * Uploads and sets a new profile image for the given user.
     * Returns the secure Cloudinary URL for the image.
     */
    String updateProfileImage(User user, MultipartFile imageFile);

    /**
     * Removes any stored profile image reference for the user and clears profileImageUrl/profileImagePath as needed.
     */
    void removeProfileImage(User user);

    /**
     * Upload (or replace) the user's banner image and return the stored URL.
     */
    String updateBannerImage(User user, MultipartFile imageFile);

    /**
     * Remove the user's banner image reference.
     */
    void removeBannerImage(User user);
}
