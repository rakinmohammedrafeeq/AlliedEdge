package org.AE.alliededge.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.AE.alliededge.model.Project;
import org.AE.alliededge.model.User;
import org.AE.alliededge.service.CloudinaryService;
import org.AE.alliededge.service.ProjectService;
import org.AE.alliededge.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {
    private final UserService userService;
    private final CloudinaryService cloudinaryService;

    @Autowired
    private ProjectService projectService;

    public UserController(UserService userService, CloudinaryService cloudinaryService) {
        this.userService = userService;
        this.cloudinaryService = cloudinaryService;
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/users/search")
    public ResponseEntity<Map<String, Object>> searchUsers(@RequestParam String keyword, Authentication authentication) {
        User currentUser = authentication == null ? null : userService.getUserByPrincipal(authentication.getName());
        Long excludeId = currentUser == null ? null : currentUser.getId();

        List<User> users = userService.searchUsersExcludingUserId(keyword, excludeId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("users", users);
        body.put("keyword", keyword);
        return ResponseEntity.ok(body);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/resume/view/{id}")
    public ResponseEntity<Map<String, Object>> viewResume(@PathVariable Long id) {
        User user = userService.getUserById(id);
        String resumeUrl = user == null ? null : user.getResumeUrl();
        if (resumeUrl == null || resumeUrl.isBlank()) {
            if (user != null && user.getResumePublicId() != null) {
                resumeUrl = cloudinaryService.getRawUrlFromPublicId(user.getResumePublicId());
            }
        }
        if (resumeUrl == null || resumeUrl.isBlank()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Resume not found"));
        }
        return ResponseEntity.ok(Map.of("resumeUrl", resumeUrl));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/resume/download/{id}")
    public void downloadResume(@PathVariable Long id, HttpServletResponse response, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        User user = userService.getUserById(id);
        if (user == null) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String resumeUrl = user.getResumeUrl();

        if (resumeUrl == null || resumeUrl.isEmpty()) {
            if (user.getResumePublicId() != null) {
                resumeUrl = cloudinaryService.getRawUrlFromPublicId(user.getResumePublicId());
            }
        }

        if (resumeUrl == null || resumeUrl.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String filename = user.getDisplayName() != null
                ? user.getDisplayName().replaceAll("\\s+", "_") + "_Resume.pdf"
                : user.getUsername() + "_Resume.pdf";

        try {
            cloudinaryService.streamResumeToResponse(resumeUrl, filename, response);
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    // ===== SKILLS ENDPOINTS =====

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/profile/skills")
    public ResponseEntity<Map<String, Object>> addSkill(@RequestParam String skill, Authentication auth) {
        User currentUser = userService.getUserByEmail(auth.getName());
        if (currentUser != null && skill != null && !skill.trim().isEmpty()) {
            userService.addSkill(currentUser.getId(), skill.trim());
            return ResponseEntity.ok(Map.of("message", "Skill added successfully!"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid skill"));
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/profile/skills")
    public ResponseEntity<Map<String, Object>> removeSkill(@RequestParam String skill, Authentication auth) {
        User currentUser = userService.getUserByEmail(auth.getName());
        if (currentUser != null && skill != null) {
            userService.removeSkill(currentUser.getId(), skill);
            return ResponseEntity.ok(Map.of("message", "Skill removed successfully!"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid skill"));
    }

    // ===== PROJECTS ENDPOINTS =====

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/profile/projects")
    public ResponseEntity<Map<String, Object>> addProject(@RequestParam String title,
                                                          @RequestParam String description,
                                                          @RequestParam(required = false) String projectUrl,
                                                          Authentication auth) {
        User currentUser = userService.getUserByEmail(auth.getName());
        if (currentUser != null && title != null && !title.trim().isEmpty()) {
            Project project = new Project();
            project.setTitle(title.trim());
            project.setDescription(description != null ? description.trim() : "");
            project.setProjectUrl(projectUrl != null && !projectUrl.trim().isEmpty() ? projectUrl.trim() : null);
            project.setUser(currentUser);

            projectService.saveProject(project);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Project added successfully!", "project", project));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid project"));
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/profile/projects/{id}")
    public ResponseEntity<Map<String, Object>> editProject(@PathVariable Long id,
                                                           @RequestParam String title,
                                                           @RequestParam String description,
                                                           @RequestParam(required = false) String projectUrl,
                                                           Authentication auth) {
        User currentUser = userService.getUserByEmail(auth.getName());
        Project project = projectService.findById(id).orElse(null);

        if (project != null && currentUser != null && project.getUser().getId().equals(currentUser.getId())) {
            project.setTitle(title.trim());
            project.setDescription(description != null ? description.trim() : "");
            project.setProjectUrl(projectUrl != null && !projectUrl.trim().isEmpty() ? projectUrl.trim() : null);

            projectService.saveProject(project);
            return ResponseEntity.ok(Map.of("message", "Project updated successfully!", "project", project));
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Unauthorized or project not found"));
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/profile/projects/{id}")
    public ResponseEntity<Map<String, Object>> deleteProject(@PathVariable Long id, Authentication auth) {
        User currentUser = userService.getUserByEmail(auth.getName());
        Project project = projectService.findById(id).orElse(null);

        if (project != null && currentUser != null && project.getUser().getId().equals(currentUser.getId())) {
            projectService.deleteProject(id);
            return ResponseEntity.ok(Map.of("message", "Project deleted successfully!"));
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Unauthorized or project not found"));
    }
}
