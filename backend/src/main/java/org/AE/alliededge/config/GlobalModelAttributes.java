package org.AE.alliededge.config;

import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

@ControllerAdvice
@Component
public class GlobalModelAttributes {

    private static final String DEFAULT_AVATAR_PATH = "/images/default-profile.jpg";

    private final UserRepository userRepository;

    public GlobalModelAttributes(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @ModelAttribute
    public void addCurrentUser(Model model, @AuthenticationPrincipal Object principal) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            model.addAttribute("currentUser", null);
            model.addAttribute("isAdmin", false);
            model.addAttribute("isAuthenticated", false);
            model.addAttribute("currentAvatarUrl", DEFAULT_AVATAR_PATH);
            model.addAttribute("currentDisplayName", null);
            return;
        }

        // Spring Security will often use the literal string "anonymousUser" for unauthenticated requests
        if ("anonymousUser".equals(authentication.getPrincipal())) {
            model.addAttribute("currentUser", null);
            model.addAttribute("isAdmin", false);
            model.addAttribute("isAuthenticated", false);
            model.addAttribute("currentAvatarUrl", DEFAULT_AVATAR_PATH);
            model.addAttribute("currentDisplayName", null);
            return;
        }

        String email = null;

        // Username/password login
        if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        }
        // OAuth2 login (Google)
        else if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            OAuth2User oauthUser = oauthToken.getPrincipal();
            if (oauthUser != null) {
                Map<String, Object> attributes = oauthUser.getAttributes();
                Object emailAttr = attributes.get("email");
                if (emailAttr != null) {
                    email = emailAttr.toString();
                }
            }
        }

        if (email == null || email.isBlank()) {
            model.addAttribute("currentUser", null);
            model.addAttribute("isAdmin", false);
            model.addAttribute("isAuthenticated", false);
            model.addAttribute("currentAvatarUrl", DEFAULT_AVATAR_PATH);
            model.addAttribute("currentDisplayName", null);
            return;
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            model.addAttribute("currentUser", null);
            model.addAttribute("isAdmin", false);
            model.addAttribute("isAuthenticated", false);
            model.addAttribute("currentAvatarUrl", DEFAULT_AVATAR_PATH);
            model.addAttribute("currentDisplayName", null);
            return;
        }

        User user = userOpt.get();
        model.addAttribute("currentUser", user);
        model.addAttribute("isAuthenticated", true);

        // Determine admin flag either from user entity or from authorities
        boolean isAdmin = user.isAdmin();
        if (!isAdmin && authentication != null) {
            Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
            if (authorities != null) {
                isAdmin = authorities.stream().anyMatch(a ->
                        "ROLE_ADMIN".equals(a.getAuthority()) ||
                        "ADMIN".equalsIgnoreCase(a.getAuthority()));
            }
        }
        model.addAttribute("isAdmin", isAdmin);

        // Avatar URL and display name helpers for templates
        String avatarUrl = user.getProfileImageUrl();
        if (avatarUrl == null || avatarUrl.isBlank()) {
            avatarUrl = DEFAULT_AVATAR_PATH;
        }
        model.addAttribute("currentAvatarUrl", avatarUrl);

        String displayName = user.getDisplayName();
        if (displayName == null || displayName.isBlank()) {
            displayName = user.getUsername();
        }
        model.addAttribute("currentDisplayName", displayName);
    }
}
