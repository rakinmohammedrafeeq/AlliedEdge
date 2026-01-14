package org.AE.alliededge.dto;

import org.AE.alliededge.model.User;

/**
 * A sanitized view of {@link User} suitable for public profile pages.
 *
 * IMPORTANT: Do not add sensitive fields here (email, resumeUrl, etc.).
 */
public class PublicProfileUserDto {
    private Long id;
    private String username;
    private String displayName;

    private String bio;
    private String linkedin;
    private String github;
    private String website;
    private String location;
    private String twitter;

    private String experienceJson;
    private String languagesJson;
    private String educationJson;
    private String availabilityJson;

    private String profileImageUrl;
    private String bannerImageUrl;

    // Visibility flags (so the frontend can render conditional sections)
    private boolean showEmailOnProfile;
    private boolean showResumeOnProfile;

    // Public role signal used for the verified badge.
    // This is safe to expose and does not grant permissions.
    private boolean admin;

    // Optional public fields (only set when corresponding show* flags are true)
    private String email;
    private String resumeUrl;

    public static PublicProfileUserDto from(User u) {
        if (u == null) return null;
        PublicProfileUserDto dto = new PublicProfileUserDto();
        dto.id = u.getId();
        dto.username = u.getUsername();
        dto.displayName = u.getDisplayName();
        dto.bio = u.getBio();
        dto.linkedin = u.getLinkedin();
        dto.github = u.getGithub();
        dto.website = u.getWebsite();
        dto.location = u.getLocation();
        dto.twitter = u.getTwitter();
        dto.experienceJson = u.getExperienceJson();
        dto.languagesJson = u.getLanguagesJson();
        dto.educationJson = u.getEducationJson();
        dto.availabilityJson = u.getAvailabilityJson();
        dto.profileImageUrl = u.getProfileImageUrl();
        dto.bannerImageUrl = u.getBannerImageUrl();
        dto.showEmailOnProfile = u.isShowEmailOnProfile();
        dto.showResumeOnProfile = u.isShowResumeOnProfile();
        dto.admin = u.isAdmin();

        dto.email = dto.showEmailOnProfile ? u.getEmail() : null;
        dto.resumeUrl = dto.showResumeOnProfile ? u.getResumeUrl() : null;
        return dto;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getBio() {
        return bio;
    }

    public String getLinkedin() {
        return linkedin;
    }

    public String getGithub() {
        return github;
    }

    public String getWebsite() {
        return website;
    }

    public String getLocation() {
        return location;
    }

    public String getTwitter() {
        return twitter;
    }

    public String getExperienceJson() {
        return experienceJson;
    }

    public String getLanguagesJson() {
        return languagesJson;
    }

    public String getEducationJson() {
        return educationJson;
    }

    public String getAvailabilityJson() {
        return availabilityJson;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public String getBannerImageUrl() {
        return bannerImageUrl;
    }

    public boolean isShowEmailOnProfile() {
        return showEmailOnProfile;
    }

    public boolean isShowResumeOnProfile() {
        return showResumeOnProfile;
    }

    public String getEmail() {
        return email;
    }

    public String getResumeUrl() {
        return resumeUrl;
    }

    public boolean isAdmin() {
        return admin;
    }
}
