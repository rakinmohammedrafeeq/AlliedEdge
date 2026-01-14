package org.AE.alliededge.controller;

import org.AE.alliededge.model.User;
import org.AE.alliededge.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.*;

import org.AE.alliededge.repository.UserRepository;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;

    public AuthController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @GetMapping("/auth/status")
    public Map<String, Object> status() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        boolean authenticated = auth != null
                && auth.isAuthenticated()
                && !(auth instanceof AnonymousAuthenticationToken);

        Map<String, Object> body = new HashMap<>();
        body.put("authenticated", authenticated);

        if (!authenticated) {
            return body;
        }

        String email = null;
        try {
            email = auth.getName();
        } catch (Exception ignored) {
            // Defensive: some principals can throw on getName
        }

        // In some authentication modes, getName() might not be the email.
        // Prefer a stable email from OAuth2 attributes when available.
        if (email == null || !email.contains("@")) {
            Object principal = auth.getPrincipal();
            if (principal instanceof OAuth2User oauth2User) {
                Object attrEmail = oauth2User.getAttributes().get("email");
                if (attrEmail != null) {
                    email = String.valueOf(attrEmail);
                }
            }
        }

        body.put("name", email);

        final String emailFinal = email;

        // Always emit a user payload when authenticated, even if DB lookup fails.
        // This prevents the SPA from treating the session as logged out.
        Map<String, Object> userPayload = new HashMap<>();
        userPayload.put("role", auth.getAuthorities().stream().findFirst().map(org.springframework.security.core.GrantedAuthority::getAuthority).orElse(null));

        if (emailFinal != null) {
            try {
                userRepository.findByEmail(emailFinal).ifPresentOrElse(u -> {
                    if (u.isBanned()) {
                        body.put("authenticated", false);
                        body.put("message", "Your account has been banned. Please contact support.");
                        userPayload.clear();
                        return;
                    }
                    userPayload.put("id", u.getId());
                    String display = u.getDisplayName();
                    String username = u.getUsername();
                    userPayload.put("name", (display != null && !display.isBlank()) ? display : username);
                    userPayload.put("email", u.getEmail());
                    userPayload.put("role", u.getRole());
                    userPayload.put("profileImageUrl", u.getProfileImageUrl());
                }, () -> {
                    // Fallback if user isn't found in DB (shouldn't happen, but avoid 500)
                    userPayload.put("email", emailFinal);
                });
            } catch (Exception ex) {
                // Avoid failing the endpoint; include minimal info.
                userPayload.put("email", emailFinal);
            }
        }

        body.put("user", userPayload);
        return body;
    }

    @PostMapping("/auth/logout")
    public Map<String, Object> logout(jakarta.servlet.http.HttpServletRequest request) {
        var session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return Map.of("message", "ok");
    }

    @PostMapping("/auth/register")
    public ResponseEntity<Map<String, Object>> registerUser(@ModelAttribute User user) {
        try {
            userService.registerUser(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Registered"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }
}
