package org.AE.alliededge.dto;

import org.AE.alliededge.model.User;

/**
 * Minimal, safe representation of a user profile for frontend consumption.
 * Keeps response shape stable and avoids serializing JPA relationships.
 */
public class ProfileResponseDto {
    private Long id;
    private String email;
    private String username;
    private String role;
    private boolean admin;

    private String displayName;
    private String bio;
    private String linkedin;
    private String github;
    private String website;
    private String location;
    private String twitter;

    private String profileImageUrl;
    private String bannerImageUrl;
    private String resumeUrl;

    // JSON sections (frontend parses them)
    private String experienceJson;
    private String languagesJson;
    private String educationJson;
    private String availabilityJson;

    public static ProfileResponseDto from(User u) {
        ProfileResponseDto dto = new ProfileResponseDto();
        dto.id = u.getId();
        dto.email = u.getEmail();
        dto.username = u.getUsername();
        dto.role = u.getRole();
        dto.admin = u.isAdmin();
        dto.displayName = u.getDisplayName();
        dto.bio = u.getBio();
        dto.linkedin = u.getLinkedin();
        dto.github = u.getGithub();
        dto.website = u.getWebsite();
        dto.location = u.getLocation();
        dto.twitter = u.getTwitter();
        dto.profileImageUrl = u.getProfileImageUrl();
        dto.bannerImageUrl = u.getBannerImageUrl();
        dto.resumeUrl = u.getResumeUrl();
        dto.experienceJson = u.getExperienceJson();
        dto.languagesJson = u.getLanguagesJson();
        dto.educationJson = u.getEducationJson();
        dto.availabilityJson = u.getAvailabilityJson();
        return dto;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getUsername() {
        return username;
    }

    public String getRole() {
        return role;
    }

    public boolean isAdmin() {
        return admin;
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

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public String getBannerImageUrl() {
        return bannerImageUrl;
    }

    public String getResumeUrl() {
        return resumeUrl;
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
}
