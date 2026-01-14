package org.AE.alliededge.controller;

import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class SetupUsernameController {

    private final UserRepository userRepository;

    public SetupUsernameController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }

        Object principal = authentication.getPrincipal();

        // For OAuth2 and form login we treat authentication.getName() as the canonical email
        if (principal instanceof OAuth2User) {
            String email = authentication.getName();
            return userRepository.findByEmail(email).orElse(null);
        }

        // Fallback for non-OAuth principals (e.g. form login): also treat name as email
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    private boolean needsUsernameSetup(User user) {
        if (user == null) return false;
        // Admin users should never be forced through username setup
        if (user.isAdmin()) return false;
        String username = user.getUsername();
        return username == null || username.isBlank() || username.contains("@");
    }

    @GetMapping("/setup-username")
    public ResponseEntity<Map<String, Object>> getSetupStatus() {
        User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("needsSetup", needsUsernameSetup(user));
        body.put("currentDisplayName", user.getDisplayName());

        String suggested = null;
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            suggested = user.getDisplayName().trim().toLowerCase().replaceAll("[^a-z0-9]+", "-");
        } else if (user.getUsername() != null && user.getUsername().contains("@")) {
            suggested = user.getUsername().substring(0, user.getUsername().indexOf('@'));
        }
        body.put("suggestedUsername", suggested);

        return ResponseEntity.ok(body);
    }

    @PostMapping("/setup-username")
    public ResponseEntity<Map<String, Object>> handleSetup(@RequestParam("username") String username) {
        User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }

        // If user is admin, or no longer needs setup, reject (frontend should just proceed)
        if (user.isAdmin() || !needsUsernameSetup(user)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Username setup not required"));
        }

        String trimmed = username == null ? "" : username.trim();
        String error = null;

        if (trimmed.isEmpty()) {
            error = "Username is required";
        } else if (trimmed.contains("@")) {
            error = "Username cannot be an email address";
        } else if (!trimmed.matches("[a-zA-Z0-9._-]{3,30}")) {
            error = "Username must be 3-30 characters and contain only letters, numbers, dots, underscores, or hyphens";
        } else if (userRepository.findByUsername(trimmed).isPresent()) {
            error = "Username is already taken";
        }

        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("message", error));
        }

        user.setUsername(trimmed);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Username set"));
    }
}
