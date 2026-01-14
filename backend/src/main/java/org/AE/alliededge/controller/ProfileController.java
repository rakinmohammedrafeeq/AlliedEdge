package org.AE.alliededge.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.AE.alliededge.dto.ProfileResponseDto;
import org.AE.alliededge.dto.PublicProfileUserDto;
import org.AE.alliededge.model.Post;
import org.AE.alliededge.model.User;
import org.AE.alliededge.service.*;
import org.AE.alliededge.service.ProfileService.AdminPostStats;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ProfileController {

    private final ProfileService profileService;
    private final UserService userService;
    private final PostService postService;
    private final ProjectService projectService;
    private final UserFollowService userFollowService;
    private final ResumeService resumeService;
    private final CloudinaryService cloudinaryService;

    public ProfileController(ProfileService profileService, UserService userService, PostService postService,
                             ProjectService projectService, UserFollowService userFollowService, ResumeService resumeService,
                             CloudinaryService cloudinaryService) {
        this.profileService = profileService;
        this.userService = userService;
        this.postService = postService;
        this.projectService = projectService;
        this.userFollowService = userFollowService;
        this.resumeService = resumeService;
        this.cloudinaryService = cloudinaryService;
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getMyProfile(Authentication authentication) {
        User user = profileService.getCurrentUser();
        if (user == null || authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("user", user);
        body.put("followerCount", userFollowService.getFollowerCount(user.getId()));
        body.put("followingCount", userFollowService.getFollowingCount(user.getId()));

        List<org.AE.alliededge.model.Project> projects = projectService.getProjectsByUser(user.getId());
        body.put("projects", projects);

        List<String> skills = user.getSkills();
        body.put("skills", skills != null ? skills : new java.util.ArrayList<>());

        boolean canBecomeAuthor = !user.isAuthor() && !user.isAdmin();
        body.put("canBecomeAuthor", canBecomeAuthor);

        if (user.isAdmin()) {
            AdminPostStats stats = profileService.calculateAdminPostStats(user);
            body.put("adminStats", stats);
        } else {
            long commentCount = userService.countCommentsByUser(user);
            long likeCount = userService.countLikesByUser(user);
            body.put("userCommentCount", commentCount);
            body.put("userLikeCount", likeCount);
        }

        return ResponseEntity.ok(body);
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestParam(required = false) String username,
                                                             @RequestParam(required = false) String displayName,
                                                             @RequestParam(required = false) String bio,
                                                             @RequestParam(required = false) String linkedin,
                                                             @RequestParam(required = false) String github,
                                                             @RequestParam(required = false) String website,
                                                             @RequestParam(required = false) String location,
                                                             @RequestParam(required = false) String twitter,
                                                             @RequestParam(required = false) String skillsJson,
                                                             @RequestParam(required = false) String projectsJson,
                                                             @RequestParam(required = false) String experienceJson,
                                                             @RequestParam(required = false) String languagesJson,
                                                             @RequestParam(required = false) String educationJson,
                                                             @RequestParam(required = false) String availabilityJson,
                                                             @RequestParam(required = false) Boolean showEmailOnProfile,
                                                             @RequestParam(required = false) Boolean showResumeOnProfile,
                                                             @RequestParam(name = "profileImageFile", required = false) MultipartFile profileImageFile,
                                                             @RequestParam(name = "removeProfileImage", required = false) String removeProfileImage,
                                                             @RequestParam(name = "bannerImageFile", required = false) MultipartFile bannerImageFile,
                                                             @RequestParam(name = "removeBannerImage", required = false) String removeBannerImage,
                                                             Authentication authentication) {
        User user = profileService.getCurrentUser();
        if (user == null || authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }

        // Handle username change (for both admins and normal users)
        if (username != null) {
            String error = userService.validateAndChangeUsername(user, username);
            if (error != null) {
                return ResponseEntity.badRequest().body(Map.of("message", error, "field", "username"));
            }
        }

        // Handle profile image removal ONLY when explicitly requested.
        // Frontend always sends removeProfileImage as "true"/"false".
        if (Boolean.parseBoolean(removeProfileImage)) {
            profileService.removeProfileImage(user);
        }

        // Handle new profile image upload
        if (profileImageFile != null && !profileImageFile.isEmpty()) {
            try {
                profileService.updateProfileImage(user, profileImageFile);
            } catch (IllegalArgumentException | IllegalStateException ex) {
                return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage(), "field", "profileImageFile"));
            }
        }

        // Handle banner image removal ONLY when explicitly requested.
        if (Boolean.parseBoolean(removeBannerImage)) {
            profileService.removeBannerImage(user);
        }

        // Handle new banner image upload
        if (bannerImageFile != null && !bannerImageFile.isEmpty()) {
            try {
                profileService.updateBannerImage(user, bannerImageFile);
            } catch (IllegalArgumentException | IllegalStateException ex) {
                return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage(), "field", "bannerImageFile"));
            }
        }

        profileService.updateProfile(user, displayName, bio, linkedin, github, website,
                location, twitter, skillsJson, projectsJson, experienceJson, languagesJson, educationJson, availabilityJson,
                showEmailOnProfile, showResumeOnProfile);

        // Re-fetch current user to ensure response matches DB state after any saves.
        User refreshed = profileService.getCurrentUser();

        return ResponseEntity.ok(Map.of(
                "message", "Profile updated",
                "user", ProfileResponseDto.from(refreshed != null ? refreshed : user)
        ));
    }

    @PostMapping("/profile/become-author")
    public ResponseEntity<Map<String, Object>> becomeAuthor(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }
        userService.upgradeCurrentUserToAuthor();
        return ResponseEntity.ok(Map.of("message", "Upgraded to author"));
    }

    @GetMapping("/profile/users/{userId}")
    public ResponseEntity<Map<String, Object>> getPublicProfile(@PathVariable Long userId, Authentication authentication) {
        User user = userService.getUserById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }

        List<Post> posts = postService.findPostsByUserId(userId);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("user", PublicProfileUserDto.from(user));
        body.put("posts", posts);
        body.put("projects", projectService.getProjectsByUser(userId));
        body.put("skills", user.getSkills() != null ? user.getSkills() : new java.util.ArrayList<>());
        body.put("experience", user.getExperienceJson());
        body.put("languages", user.getLanguagesJson());
        body.put("education", user.getEducationJson());
        body.put("availability", user.getAvailabilityJson());
        body.put("followerCount", userFollowService.getFollowerCount(userId));
        body.put("followingCount", userFollowService.getFollowingCount(userId));

        boolean isOwner = false;
        boolean isFollowing = false;
        boolean canMessage = false;

        if (authentication != null && authentication.isAuthenticated()) {
            String principal = authentication.getName();
            isFollowing = userFollowService.isFollowing(principal, userId);
            canMessage = userFollowService.isMutualFollowing(principal, userId);

            User currentUser = userService.getUserByPrincipal(principal);
            isOwner = currentUser != null && currentUser.getId().equals(userId);
        }

        body.put("isFollowing", isFollowing);
        body.put("canMessage", canMessage);
        body.put("isOwnProfile", isOwner);
        body.put("isOwner", isOwner);

        return ResponseEntity.ok(body);
    }

    /**
     * Public profile by username.
     *
     * This is the preferred endpoint for shareable profile links because usernames are user-facing.
     */
    @GetMapping("/profile/u/{username}")
    public ResponseEntity<Map<String, Object>> getPublicProfileByUsername(@PathVariable String username,
                                                                          Authentication authentication) {
        if (username == null || username.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Username is required"));
        }

        User user = userService.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }

        Long userId = user.getId();
        List<Post> posts = postService.findPostsByUserId(userId);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("user", PublicProfileUserDto.from(user));
        body.put("posts", posts);
        body.put("projects", projectService.getProjectsByUser(userId));
        body.put("skills", user.getSkills() != null ? user.getSkills() : new java.util.ArrayList<>());
        body.put("experience", user.getExperienceJson());
        body.put("languages", user.getLanguagesJson());
        body.put("education", user.getEducationJson());
        body.put("availability", user.getAvailabilityJson());
        body.put("followerCount", userFollowService.getFollowerCount(userId));
        body.put("followingCount", userFollowService.getFollowingCount(userId));

        boolean isOwner = false;
        boolean isFollowing = false;
        boolean canMessage = false;

        if (authentication != null && authentication.isAuthenticated()) {
            String principal = authentication.getName();
            isFollowing = userFollowService.isFollowing(principal, userId);
            canMessage = userFollowService.isMutualFollowing(principal, userId);

            User currentUser = userService.getUserByPrincipal(principal);
            isOwner = currentUser != null && currentUser.getId().equals(userId);
        }

        body.put("isFollowing", isFollowing);
        body.put("canMessage", canMessage);
        body.put("isOwnProfile", isOwner);
        body.put("isOwner", isOwner);

        return ResponseEntity.ok(body);
    }

    @PostMapping("/profile/resume")
    public ResponseEntity<Map<String, Object>> uploadResume(@RequestParam("resumeFile") MultipartFile resumeFile,
                                                            Authentication authentication) {
        User user = profileService.getCurrentUser();
        if (user == null || authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }

        try {
            resumeService.uploadResume(user, resumeFile);
            return ResponseEntity.ok(Map.of("message", "Resume uploaded"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/profile/resume")
    public ResponseEntity<Map<String, Object>> deleteResume(Authentication authentication) {
        User user = profileService.getCurrentUser();
        if (user == null || authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }

        resumeService.deleteResume(user);
        return ResponseEntity.ok(Map.of("message", "Resume deleted"));
    }

    /**
     * Download own resume - streams PDF through server with proper headers
     * Only accessible to the profile owner
     */
    @GetMapping("/profile/resume/download")
    public void downloadOwnResume(HttpServletResponse response, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        User user = profileService.getCurrentUser();
        if (user == null) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        if (user.getResumeUrl() == null || user.getResumeUrl().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String filename = user.getDisplayName() != null
                ? user.getDisplayName().replaceAll("\\s+", "_") + "_Resume.pdf"
                : "Resume.pdf";

        try {
            cloudinaryService.streamResumeToResponse(user.getResumeUrl(), filename, response);
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Resume link for a user (return URL rather than redirect/view)
     */
    @GetMapping("/users/{userId}/resume")
    public ResponseEntity<Map<String, Object>> getResumeLink(@PathVariable Long userId) {
        User user = userService.getUserById(userId);
        if (user == null || user.getResumeUrl() == null || user.getResumeUrl().isBlank()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Resume not found"));
        }
        return ResponseEntity.ok(Map.of("resumeUrl", user.getResumeUrl()));
    }

    /**
     * Download resume by user id (HTTP 302 Location)
     */
    @GetMapping("/users/{userId}/resume/download")
    public ResponseEntity<Void> downloadResumeByUserId(@PathVariable Long userId) {
        User user = userService.getUserById(userId);
        if (user == null || user.getResumeUrl() == null) {
            return ResponseEntity.notFound().build();
        }

        String resumeUrl = user.getResumeUrl();
        if (resumeUrl == null || resumeUrl.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(resumeUrl))
                .build();
    }
}
