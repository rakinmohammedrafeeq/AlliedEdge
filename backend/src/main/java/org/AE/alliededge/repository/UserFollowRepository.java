package org.AE.alliededge.repository;

import org.AE.alliededge.model.User;
import org.AE.alliededge.model.UserFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {

    /**
     * Check if follower is following the target user
     */
    boolean existsByFollowerAndFollowing(User follower, User following);

    /**
     * Delete follow relationship
     */
    @Transactional
    void deleteByFollowerAndFollowing(User follower, User following);

    /**
     * Count how many users the given user is following
     */
    long countByFollower(User user);

    /**
     * Count how many followers the given user has
     */
    long countByFollowing(User user);

    /**
     * Get list of users that the given user is following
     */
    List<UserFollow> findByFollower(User user);

    /**
     * Get list of followers for the given user
     */
    List<UserFollow> findByFollowing(User user);
}
