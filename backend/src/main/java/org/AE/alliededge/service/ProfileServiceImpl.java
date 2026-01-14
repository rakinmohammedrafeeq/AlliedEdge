package org.AE.alliededge.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.AE.alliededge.model.Project;
import org.AE.alliededge.model.Post;
import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.PostRepository;
import org.AE.alliededge.repository.ProjectRepository;
import org.AE.alliededge.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Transactional
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ProjectRepository projectRepository;
    private final UserService userService;
    private final CloudinaryService cloudinaryService;
    private final ObjectMapper objectMapper;

    public ProfileServiceImpl(UserRepository userRepository,
                              PostRepository postRepository,
                              ProjectRepository projectRepository,
                              UserService userService,
                              CloudinaryService cloudinaryService,
                              ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.projectRepository = projectRepository;
        this.userService = userService;
        this.cloudinaryService = cloudinaryService;
        this.objectMapper = objectMapper;
    }

    @Override
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            // No authenticated principal in context
            return null;
        }

        String principalName = authentication.getName();
        // Spring Security uses the literal string "anonymousUser" when no user is logged in
        if ("anonymousUser".equals(principalName)) {
            return null;
        }

        return userRepository.findByEmail(principalName).orElse(null);
    }

    @Override
    public void updateProfile(User user,
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
                              Boolean showResumeOnProfile) {
        // IMPORTANT: Treat this endpoint as a partial update.
        // If a field is omitted (null), keep the existing DB value.
        // If a field is provided but blank, clear it (store null).

        if (displayName != null) {
            String v = displayName.trim();
            user.setDisplayName(v.isEmpty() ? null : v);
        }
        if (bio != null) {
            String v = bio.trim();
            user.setBio(v.isEmpty() ? null : v);
        }
        if (linkedin != null) {
            String v = linkedin.trim();
            user.setLinkedin(v.isEmpty() ? null : v);
        }
        if (github != null) {
            String v = github.trim();
            user.setGithub(v.isEmpty() ? null : v);
        }
        if (website != null) {
            String v = website.trim();
            user.setWebsite(v.isEmpty() ? null : v);
        }
        if (location != null) {
            String v = location.trim();
            user.setLocation(v.isEmpty() ? null : v);
        }
        if (twitter != null) {
            String v = twitter.trim();
            user.setTwitter(v.isEmpty() ? null : v);
        }

        if (experienceJson != null) {
            String v = experienceJson.trim();
            user.setExperienceJson(v.isEmpty() ? null : v);
        }
        if (languagesJson != null) {
            String v = languagesJson.trim();
            user.setLanguagesJson(v.isEmpty() ? null : v);
        }
        if (educationJson != null) {
            String v = educationJson.trim();
            user.setEducationJson(v.isEmpty() ? null : v);
        }
        if (availabilityJson != null) {
            String v = availabilityJson.trim();
            user.setAvailabilityJson(v.isEmpty() ? null : v);
        }

        // Public visibility flags: only update when explicitly provided.
        if (showEmailOnProfile != null) {
            user.setShowEmailOnProfile(showEmailOnProfile);
        }
        if (showResumeOnProfile != null) {
            user.setShowResumeOnProfile(showResumeOnProfile);
        }

        if (skillsJson != null) {
            // Skills are stored as a normalized list, not JSON.
            List<String> skills = parseStringListJson(skillsJson);
            user.setSkills(skills != null ? skills : new ArrayList<>());
        }

        // Persist scalar fields first.
        userRepository.save(user);

        if (projectsJson != null) {
            // Replace-all semantics for projects: frontend edits the whole list.
            // We delete existing projects and re-insert.
            List<Map<String, Object>> projects = parseListOfMapsJson(projectsJson);

            // remove existing
            List<Project> existing = projectRepository.findByUserId(user.getId());
            if (existing != null && !existing.isEmpty()) {
                projectRepository.deleteAll(existing);
            }

            if (projects != null) {
                for (Map<String, Object> p : projects) {
                    String title = stringVal(p.get("title"));
                    if (title == null || title.isBlank()) continue;

                    Project proj = new Project();
                    proj.setUser(user);
                    proj.setTitle(title);
                    proj.setSummary(stringVal(p.get("summary")));
                    proj.setStatus(stringVal(p.get("status")));
                    proj.setProblem(stringVal(p.get("problem")));
                    proj.setBuilt(stringVal(p.get("built")));
                    proj.setRole(stringVal(p.get("role")));

                    // Optional legacy fields
                    proj.setDescription(stringVal(p.get("description")));
                    proj.setProjectUrl(stringVal(p.get("link")));

                    proj.setTechStack(stringListVal(p.get("techStack")));
                    proj.setProofLinks(mapVal(p.get("proofLinks")));

                    projectRepository.save(proj);
                }
            }
        }
    }

    private List<String> parseStringListJson(String json) {
        if (json == null) return null;
        String trimmed = json.trim();
        if (trimmed.isEmpty()) return new ArrayList<>();
        try {
            return objectMapper.readValue(trimmed, new TypeReference<>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<Map<String, Object>> parseListOfMapsJson(String json) {
        if (json == null) return null;
        String trimmed = json.trim();
        if (trimmed.isEmpty()) return new ArrayList<>();
        try {
            return objectMapper.readValue(trimmed, new TypeReference<>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String stringVal(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o);
        return s.isBlank() ? null : s;
    }

    @SuppressWarnings("unchecked")
    private List<String> stringListVal(Object o) {
        if (o == null) return null;
        if (o instanceof List<?> list) {
            List<String> out = new ArrayList<>();
            for (Object item : list) {
                if (item == null) continue;
                String s = String.valueOf(item).trim();
                if (!s.isEmpty()) out.add(s);
            }
            return out;
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapVal(Object o) {
        if (o instanceof Map<?, ?> m) {
            return (Map<String, Object>) m;
        }
        return null;
    }

    @Override
    public void updateUsernameForUser(User user, String newUsername) {
        // Delegate to existing validation logic in UserService so we don't duplicate rules
        String error = userService.validateAndChangeUsername(user, newUsername);
        if (error != null) {
            throw new IllegalArgumentException(error);
        }
    }

    @Override
    public AdminPostStats calculateAdminPostStats(User adminUser) {
        List<Post> posts = postRepository.findByUser(adminUser);
        AdminPostStats stats = new AdminPostStats();
        stats.setTotalPosts(posts.size());

        long totalLikes = 0L;
        long totalComments = 0L;
        long totalViews = 0L;
        for (Post post : posts) {
            totalLikes += post.getLikes();
            totalViews += post.getViews();
            if (post.getComments() != null) {
                totalComments += post.getComments().size();
            }
        }
        stats.setTotalLikes(totalLikes);
        stats.setTotalComments(totalComments);
        stats.setTotalViews(totalViews);
        return stats;
    }

    @Override
    public String updateProfileImage(User user, MultipartFile imageFile) {
        if (imageFile == null || imageFile.isEmpty()) {
            throw new IllegalArgumentException("Please select an image to upload.");
        }

        String contentType = imageFile.getContentType();
        if (contentType == null || !isSupportedImageContentType(contentType)) {
            throw new IllegalArgumentException("Only JPG, JPEG, PNG and WEBP images are allowed.");
        }

        // Upload to Cloudinary under profile_pics/ folder. The implementation of this
        // method already returns the secure_url string for the uploaded resource.
        String secureUrl = cloudinaryService.uploadFile(imageFile, "profile_pics");

        // Store canonical Cloudinary URL for all future usage. Legacy fields are kept for schema compatibility only.
        user.setProfileImageUrl(secureUrl);
        user.setProfilePhoto(null);
        user.setProfileImagePath(null);
        userRepository.save(user);

        return secureUrl;
    }

    @Override
    public void removeProfileImage(User user) {
        // Just null-out stored references. We intentionally do not delete from Cloudinary here.
        user.setProfileImageUrl(null);
        user.setProfilePhoto(null);
        user.setProfileImagePath(null);
        userRepository.save(user);
    }

    @Override
    public String updateBannerImage(User user, MultipartFile imageFile) {
        if (imageFile == null || imageFile.isEmpty()) {
            throw new IllegalArgumentException("Please select an image to upload.");
        }

        String contentType = imageFile.getContentType();
        if (contentType == null || !isSupportedImageContentType(contentType)) {
            throw new IllegalArgumentException("Only JPG, JPEG, PNG and WEBP images are allowed.");
        }

        // Upload to Cloudinary under profile_banners/ folder.
        String secureUrl = cloudinaryService.uploadFile(imageFile, "profile_banners");

        user.setBannerImageUrl(secureUrl);
        userRepository.save(user);

        return secureUrl;
    }

    @Override
    public void removeBannerImage(User user) {
        user.setBannerImageUrl(null);
        userRepository.save(user);
    }

    private boolean isSupportedImageContentType(String contentType) {
        String type = contentType.toLowerCase(Locale.ROOT);
        return type.equals("image/jpeg") || type.equals("image/jpg") || type.equals("image/png") || type.equals("image/webp");
    }

    // Local file deletion is no longer needed once migrated to Cloudinary.
}
