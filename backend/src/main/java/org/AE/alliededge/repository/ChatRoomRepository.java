package org.AE.alliededge.repository;

import org.AE.alliededge.model.ChatRoom;
import org.AE.alliededge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    /**
     * Find a chat room between two users (regardless of order)
     */
    @Query("SELECT cr FROM ChatRoom cr WHERE " +
            "(cr.user1 = :user1 AND cr.user2 = :user2) OR " +
            "(cr.user1 = :user2 AND cr.user2 = :user1)")
    Optional<ChatRoom> findByUsers(@Param("user1") User user1, @Param("user2") User user2);

    /**
     * Find all chat rooms for a user (where user is either user1 or user2)
     */
    @Query("SELECT cr FROM ChatRoom cr WHERE cr.user1 = :user OR cr.user2 = :user ORDER BY cr.id DESC")
    List<ChatRoom> findChatRoomsForUser(@Param("user") User user);
}
