package org.AE.alliededge.repository;

import org.AE.alliededge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their username.
     *
     * @param username the username to search for
     * @return an Optional containing the User if found, or empty if not found
     */
    Optional<User> findByUsername(String username);

    /**
     * Check if a username is already taken.
     *
     * @param username the username to check
     * @return true if the username exists, false otherwise
     */
    boolean existsByUsername(String username);

    /**
     * Canonical lookup by email (used for OAuth logins and identity).
     *
     * @param email the email to search for
     * @return an Optional containing the User if found, or empty if not found
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if an email is already in use.
     *
     * @param email the email to check
     * @return true if the email exists, false otherwise
     */
    boolean existsByEmail(String email);

    /**
     * Finds users by their role.
     *
     * @param role the role to search for
     * @return a List of Users with the given role
     */
    List<User> findByRole(String role);

    /**
     * Count users by their role.
     *
     * @param role the role to count users for
     * @return the number of users with the given role
     */
    long countByRole(String role);

    /**
     * Finds users by their role and status.
     *
     * @param role   the role to search for
     * @param status the status to search for
     * @return a List of Users with the given role and status
     */
    List<User> findByRoleAndStatus(String role, String status);

    /**
     * Search users by username or display name (case-insensitive, partial match).
     */
    List<User> findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(String username, String displayName);

    /**
     * Search users by username, email, or display name (case-insensitive, partial
     * match).
     * Used by admin dashboard for comprehensive user search.
     */
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.displayName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<User> searchUsers(@org.springframework.data.repository.query.Param("keyword") String keyword);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u ORDER BY u.id DESC")
    org.springframework.data.domain.Page<User> findAllUsersPaged(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.displayName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    org.springframework.data.domain.Page<User> searchUsersPaged(
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            org.springframework.data.domain.Pageable pageable);

    /**
     * Search users by username or display name (case-insensitive, partial match), excluding a specific user id.
     */
    List<User> findByIdNotAndUsernameContainingIgnoreCaseOrIdNotAndDisplayNameContainingIgnoreCase(
            Long excludeId,
            String username,
            Long excludeId2,
            String displayName);
}
