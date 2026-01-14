package org.AE.alliededge.service;

import org.AE.alliededge.model.User;
import org.AE.alliededge.model.UserFollow;
import org.AE.alliededge.repository.UserFollowRepository;
import org.AE.alliededge.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserFollowService {

    private final UserFollowRepository userFollowRepository;
    private final UserRepository userRepository;

    public UserFollowService(UserFollowRepository userFollowRepository, UserRepository userRepository) {
        this.userFollowRepository = userFollowRepository;
        this.userRepository = userRepository;
    }

    private User resolvePrincipalUser(String principal) {
        if (principal == null || principal.isBlank()) {
            return null;
        }
        User byEmail = userRepository.findByEmail(principal).orElse(null);
        if (byEmail != null) return byEmail;
        return userRepository.findByUsername(principal).orElse(null);
    }

    /**
     * Follow a user
     */
    @Transactional
    public void followUser(String followerEmail, Long targetUserId) {
        User follower = resolvePrincipalUser(followerEmail);
        if (follower == null) {
            throw new IllegalArgumentException("Follower not found");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        // Prevent self-follow
        if (follower.getId().equals(target.getId())) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }

        // Check if already following
        if (userFollowRepository.existsByFollowerAndFollowing(follower, target)) {
            return; // Already following, do nothing
        }

        UserFollow userFollow = new UserFollow();
        userFollow.setFollower(follower);
        userFollow.setFollowing(target);
        userFollowRepository.save(userFollow);
    }

    /**
     * Unfollow a user
     */
    @Transactional
    public void unfollowUser(String followerEmail, Long targetUserId) {
        User follower = resolvePrincipalUser(followerEmail);
        if (follower == null) {
            throw new IllegalArgumentException("Follower not found");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        userFollowRepository.deleteByFollowerAndFollowing(follower, target);
    }

    /**
     * Check if user is following another user
     */
    public boolean isFollowing(String followerEmail, Long targetUserId) {
        User follower = resolvePrincipalUser(followerEmail);
        User target = userRepository.findById(targetUserId).orElse(null);

        if (follower == null || target == null) {
            return false;
        }

        return userFollowRepository.existsByFollowerAndFollowing(follower, target);
    }

    /**
     * Check if two users follow each other (mutual follow / "connected").
     */
    public boolean isMutualFollowing(String currentUserEmail, Long targetUserId) {
        User currentUser = resolvePrincipalUser(currentUserEmail);
        User targetUser = userRepository.findById(targetUserId).orElse(null);

        if (currentUser == null || targetUser == null) {
            return false;
        }

        boolean aFollowsB = userFollowRepository.existsByFollowerAndFollowing(currentUser, targetUser);
        boolean bFollowsA = userFollowRepository.existsByFollowerAndFollowing(targetUser, currentUser);
        return aFollowsB && bFollowsA;
    }

    /**
     * Get follower count for a user
     */
    public long getFollowerCount(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return 0;
        }
        return userFollowRepository.countByFollowing(user);
    }

    /**
     * Get following count for a user
     */
    public long getFollowingCount(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return 0;
        }
        return userFollowRepository.countByFollower(user);
    }

    /**
     * Get list of followers
     */
    public List<User> getFollowers(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return List.of();
        }
        return userFollowRepository.findByFollowing(user).stream()
                .map(UserFollow::getFollower)
                .collect(Collectors.toList());
    }

    /**
     * Get list of users being followed
     */
    public List<User> getFollowing(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return List.of();
        }
        return userFollowRepository.findByFollower(user).stream()
                .map(UserFollow::getFollowing)
                .collect(Collectors.toList());
    }
}
