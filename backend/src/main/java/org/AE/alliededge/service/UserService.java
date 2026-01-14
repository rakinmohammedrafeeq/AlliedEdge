package org.AE.alliededge.service;

import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }

    public User registerUser(User user) {

        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }
        String hashedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(hashedPassword);

        // Default role for local registrations (but don't override if a caller explicitly set one)
        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole("ROLE_AUTHOR");
        }

        // Normal registrations are never admin unless explicitly set elsewhere
        if (user.getRole() == null || !user.getRole().equals("ROLE_ADMIN")) {
            user.setAdmin(false);
        }

        // Default status
        if (user.getStatus() == null || user.getStatus().isBlank()) {
            user.setStatus("ACTIVE");
        }
        // If no displayName provided, fall back to username
        if (user.getDisplayName() == null || user.getDisplayName().isBlank()) {
            user.setDisplayName(user.getUsername());
        }

        return userRepository.save(user);
    }

    /**
     * Validate and change the username for the given user.
     * Returns null on success, or an error message if validation fails.
     */
    public String validateAndChangeUsername(User user, String newUsername) {
        if (user == null) {
            return "User not found";
        }

        String trimmed = newUsername == null ? "" : newUsername.trim();
        if (trimmed.isEmpty()) {
            return "Username is required";
        }
        if (trimmed.contains("@")) {
            return "Username cannot be an email address";
        }
        if (!trimmed.matches("[a-zA-Z0-9._-]{3,30}")) {
            return "Username must be 3-30 characters and contain only letters, numbers, dots, underscores, or hyphens";
        }

        // If username is unchanged, treat as success (no-op)
        if (trimmed.equals(user.getUsername())) {
            return null;
        }

        if (userRepository.existsByUsername(trimmed)) {
            return "Username is already taken";
        }

        String oldUsername = user.getUsername();
        user.setUsername(trimmed);
        // Keep displayName in sync if it previously matched the old username or was
        // blank
        if (user.getDisplayName() == null || user.getDisplayName().isBlank()
                || user.getDisplayName().equals(oldUsername)) {
            user.setDisplayName(trimmed);
        }
        userRepository.save(user);
        return null;
    }

    // --- Helpers used by profile-related controllers and global model attributes
    // ---

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Returns the currently authenticated User entity, if any.
     */
    public Optional<User> getCurrentUserOptional() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return Optional.empty();
        }
        String email = auth.getName();
        return userRepository.findByEmail(email);
    }

    public User getCurrentUserOrThrow() {
        return getCurrentUserOptional()
                .orElseThrow(() -> new IllegalStateException("Current user not found"));
    }

    public boolean isCurrentUserAuthor() {
        return getCurrentUserOptional().map(User::isAuthor).orElse(false);
    }

    public boolean isCurrentUserAdmin() {
        return getCurrentUserOptional().map(User::isAdmin).orElse(false);
    }

    /**
     * Upgrade the currently logged-in plain user to AUTHOR.
     * Does nothing if already AUTHOR or ADMIN.
     */
    public void upgradeCurrentUserToAuthor() {
        User user = getCurrentUserOrThrow();
        if (user.isAuthor() || user.isAdmin()) {
            return; // already has authoring privileges
        }
        user.setRole("ROLE_AUTHOR");
        if (user.getStatus() == null || user.getStatus().isBlank()) {
            user.setStatus("ACTIVE");
        }
        userRepository.save(user);
    }

    /**
     * Count comments created by the given user. If Comment repository is not
     * available,
     * fall back to the size of the mapped collection.
     */
    public long countCommentsByUser(User user) {
        if (user.getComments() == null) {
            return 0L;
        }
        return user.getComments().size();
    }

    /**
     * Count likes given by the user. This implementation returns 0 unless a
     * dedicated
     * likes repository exists; you can wire it later without changing callers.
     */
    public long countLikesByUser(User user) {
        return 0L;
    }

    /**
     * Search users by username or display name (case-insensitive, partial match).
     */
    public List<User> searchUsers(String keyword) {
        return userRepository.findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(keyword, keyword);
    }

    /**
     * Search users by username or display name (case-insensitive, partial match), excluding a specific user id.
     */
    public List<User> searchUsersExcludingUserId(String keyword, Long excludeUserId) {
        if (excludeUserId == null) {
            return searchUsers(keyword);
        }
        return userRepository.findByIdNotAndUsernameContainingIgnoreCaseOrIdNotAndDisplayNameContainingIgnoreCase(
                excludeUserId,
                keyword,
                excludeUserId,
                keyword
        );
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    /**
     * Resolve an authenticated principal string to a User.
     *
     * In this app, {@code Authentication#getName()} can be either:
     * - email (OAuth2 / Google)
     * - username (form login / tests)
     */
    public User getUserByPrincipal(String principal) {
        if (principal == null || principal.isBlank() || "anonymousUser".equals(principal)) {
            return null;
        }
        User byEmail = userRepository.findByEmail(principal).orElse(null);
        if (byEmail != null) {
            return byEmail;
        }
        return userRepository.findByUsername(principal).orElse(null);
    }

    // Skills management
    public void addSkill(Long userId, String skill) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getSkills() == null) {
            user.setSkills(new java.util.ArrayList<>());
        }
        if (!user.getSkills().contains(skill)) {
            user.getSkills().add(skill);
            userRepository.save(user);
        }
    }

    public void removeSkill(Long userId, String skill) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getSkills() != null) {
            user.getSkills().remove(skill);
            userRepository.save(user);
        }
    }

    public List<String> getSkills(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        return user != null && user.getSkills() != null ? user.getSkills() : new java.util.ArrayList<>();
    }
}
