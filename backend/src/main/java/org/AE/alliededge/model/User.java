package org.AE.alliededge.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "users")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Canonical login identifier (Google email for OAuth logins)
    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // ROLE_USER, ROLE_AUTHOR, ROLE_ADMIN

    // Human-readable display name for UI (e.g. "Rayan Mohammed Rafeeq")
    @Column(name = "display_name")
    private String displayName;

    // Admin flag for UI/behaviour (in addition to role)
    @Column(nullable = false)
    private boolean admin = false;

    // First login flag for showing welcome announcement
    @Column(nullable = false)
    private boolean firstLogin = true;

    // Optional status field for blocking/suspension (e.g. ACTIVE, BLOCKED)
    @Column(length = 32)
    private String status;

    // Admin-enforced ban: when true, user cannot log in.
    @Column(nullable = false)
    private boolean banned = false;

    // --- Profile fields ---
    @Column(length = 512)
    private String bio;

    @Column(length = 255)
    private String linkedin;

    @Column(length = 255)
    private String github;

    @Column(length = 255)
    private String website;

    // --- Additional profile fields persisted for the profile page ---

    @Column(length = 255)
    private String location;

    @Column(length = 255)
    private String twitter;

    /**
     * The following sections are edited in the UI but don't currently have relational tables.
     * Persist them as JSON strings (stored as TEXT) to keep the schema simple.
     */
    @Column(name = "experience_json", columnDefinition = "TEXT")
    private String experienceJson;

    @Column(name = "languages_json", columnDefinition = "TEXT")
    private String languagesJson;

    @Column(name = "education_json", columnDefinition = "TEXT")
    private String educationJson;

    @Column(name = "availability_json", columnDefinition = "TEXT")
    private String availabilityJson;

    // Canonical profile image URL (Cloudinary secure_url or other external URL)
    @Column(name = "profile_image_url", length = 512)
    private String profileImageUrl;

    // User-uploaded banner image URL (Cloudinary secure_url or other external URL)
    @Column(name = "banner_image_url", length = 512)
    private String bannerImageUrl;

    // Legacy columns kept for schema compatibility but no longer used by the app
    @Column(name = "profile_image_path", length = 512)
    private String profileImagePath;

    @Column(name = "profile_photo", length = 512)
    private String profilePhoto;

    // Resume upload fields
    @Column(name = "resume_url", length = 512)
    private String resumeUrl;

    @Column(name = "resume_public_id", length = 255)
    private String resumePublicId;

    // Skills collection
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_skills", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "skills")
    private List<String> skills = new java.util.ArrayList<>();

    // Projects relationship
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Project> projects = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "user")
    private List<Post> posts;

    @OneToMany(mappedBy = "user")
    private List<Comment> comments;

    // --- Public profile visibility flags ---
    @Column(name = "show_email_on_profile", nullable = false)
    private boolean showEmailOnProfile = false;

    @Column(name = "show_resume_on_profile", nullable = false)
    private boolean showResumeOnProfile = false;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    @JsonIgnore
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public boolean isAdmin() {
        return admin;
    }

    public void setAdmin(boolean admin) {
        this.admin = admin;
    }

    public boolean isFirstLogin() {
        return firstLogin;
    }

    public void setFirstLogin(boolean firstLogin) {
        this.firstLogin = firstLogin;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isBanned() {
        return banned;
    }

    public void setBanned(boolean banned) {
        this.banned = banned;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getLinkedin() {
        return linkedin;
    }

    public void setLinkedin(String linkedin) {
        this.linkedin = linkedin;
    }

    public String getGithub() {
        return github;
    }

    public void setGithub(String github) {
        this.github = github;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getTwitter() {
        return twitter;
    }

    public void setTwitter(String twitter) {
        this.twitter = twitter;
    }

    public String getExperienceJson() {
        return experienceJson;
    }

    public void setExperienceJson(String experienceJson) {
        this.experienceJson = experienceJson;
    }

    public String getLanguagesJson() {
        return languagesJson;
    }

    public void setLanguagesJson(String languagesJson) {
        this.languagesJson = languagesJson;
    }

    public String getEducationJson() {
        return educationJson;
    }

    public void setEducationJson(String educationJson) {
        this.educationJson = educationJson;
    }

    public String getAvailabilityJson() {
        return availabilityJson;
    }

    public void setAvailabilityJson(String availabilityJson) {
        this.availabilityJson = availabilityJson;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public String getBannerImageUrl() {
        return bannerImageUrl;
    }

    public void setBannerImageUrl(String bannerImageUrl) {
        this.bannerImageUrl = bannerImageUrl;
    }

    public String getProfileImagePath() {
        return profileImagePath;
    }

    public void setProfileImagePath(String profileImagePath) {
        this.profileImagePath = profileImagePath;
    }

    public String getProfilePhoto() {
        return profilePhoto;
    }

    public void setProfilePhoto(String profilePhoto) {
        this.profilePhoto = profilePhoto;
    }

    @JsonIgnore
    public List<Post> getPosts() {
        return posts;
    }

    public void setPosts(List<Post> posts) {
        this.posts = posts;
    }

    @JsonIgnore
    public List<Comment> getComments() {
        return comments;
    }

    public void setComments(List<Comment> comments) {
        this.comments = comments;
    }

    public String getResumeUrl() {
        return resumeUrl;
    }

    public void setResumeUrl(String resumeUrl) {
        this.resumeUrl = resumeUrl;
    }

    public String getResumePublicId() {
        return resumePublicId;
    }

    public void setResumePublicId(String resumePublicId) {
        this.resumePublicId = resumePublicId;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    @JsonIgnore
    public List<Project> getProjects() {
        return projects;
    }

    public void setProjects(List<Project> projects) {
        this.projects = projects;
    }

    public boolean isShowEmailOnProfile() {
        return showEmailOnProfile;
    }

    public void setShowEmailOnProfile(boolean showEmailOnProfile) {
        this.showEmailOnProfile = showEmailOnProfile;
    }

    public boolean isShowResumeOnProfile() {
        return showResumeOnProfile;
    }

    public void setShowResumeOnProfile(boolean showResumeOnProfile) {
        this.showResumeOnProfile = showResumeOnProfile;
    }

    // Convenience helpers
    @Transient
    public boolean isAuthor() {
        return "ROLE_AUTHOR".equals(this.role) || "ROLE_ADMIN".equals(this.role);
    }

    @Transient
    public boolean isActive() {
        return status == null || status.isBlank() || "ACTIVE".equalsIgnoreCase(status);
    }
}
