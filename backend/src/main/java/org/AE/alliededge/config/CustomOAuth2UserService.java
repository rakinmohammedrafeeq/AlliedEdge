package org.AE.alliededge.config;

import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
        OAuth2User oauth2User = delegate.loadUser(userRequest);

        // Extract email from Google's userinfo
        String email = (String) oauth2User.getAttributes().get("email");
        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Email not found in Google profile");
        }

        // Determine role based on email
        boolean isSpecialAdminEmail = email.equalsIgnoreCase("rayanmohammedrafeeq@gmail.com")
                || email.equalsIgnoreCase("rakinmohammedrafeeq@gmail.com");

        // Determine display name from Google profile if available
        Object nameAttr = oauth2User.getAttributes().get("name");
        String displayName = nameAttr != null ? nameAttr.toString() : null;
        if (displayName == null || displayName.isBlank()) {
            displayName = email.substring(0, email.indexOf('@'));
        }

        // Create or update user in DB using email as canonical key
        User user = userRepository.findByEmail(email).orElseGet(User::new);

        // If the user exists and is banned, prevent login.
        if (user.getId() != null && user.isBanned()) {
            throw new OAuth2AuthenticationException("ACCOUNT_BANNED");
        }

        boolean isNew = (user.getId() == null);
        if (isNew) {
            user.setEmail(email);
            // Prefill username from email local-part on first login
            String emailLocalPart = email.substring(0, email.indexOf('@'));
            user.setUsername(emailLocalPart);
            user.setPassword("GOOGLE_LOGIN");
            user.setFirstLogin(true); // Set first login flag for new users
        }

        // Role assignment:
        // - Never overwrite an existing role for non-admin accounts (e.g. ROLE_AUTHOR stays ROLE_AUTHOR).
        // - Only force ROLE_ADMIN for special admin emails.
        // - If role is missing, default to ROLE_AUTHOR.
        if (isSpecialAdminEmail) {
            user.setRole("ROLE_ADMIN");
            user.setAdmin(true);
        } else {
            if (user.getRole() == null || user.getRole().isBlank()) {
                user.setRole("ROLE_AUTHOR");
            }
            user.setAdmin(false);
        }

        // Set display name
        if (isSpecialAdminEmail) {
            // Preserve existing custom display names if already set
            if (user.getDisplayName() == null || user.getDisplayName().isBlank()) {
                if (email.equalsIgnoreCase("rayanmohammedrafeeq@gmail.com")) {
                    user.setDisplayName("Rayan Mohammed Rafeeq & Rakin Mohammed Rafeeq");
                } else if (email.equalsIgnoreCase("rakinmohammedrafeeq@gmail.com")) {
                    user.setDisplayName("Rakin Mohammed Rafeeq & Rayan Mohammed Rafeeq");
                }
            }
        } else {
            user.setDisplayName(displayName);
        }

        userRepository.save(user);

        // Build authorities for Spring Security from stored role
        String storedRole = user.getRole();
        String authority = storedRole != null && storedRole.startsWith("ROLE_")
                ? storedRole
                : "ROLE_" + storedRole;
        Collection<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(authority));

        // Return a DefaultOAuth2User with our mapped authorities and attributes
        Map<String, Object> attrs = new HashMap<>(oauth2User.getAttributes());
        // Expose both email (canonical principal name) and the app username handle
        attrs.put("email", email);
        attrs.put("appUsername", user.getUsername());

        // IMPORTANT: Use email as the principal name so authentication.getName()
        // returns the stable Google email across logins, even if username changes.
        return new DefaultOAuth2User(authorities, attrs, "email");
    }
}
