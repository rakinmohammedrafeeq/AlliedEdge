package org.AE.alliededge.repository;

import org.AE.alliededge.model.ChatMessage;
import org.AE.alliededge.model.ChatRoom;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * Find all messages in a chat room, ordered by timestamp
     */
    List<ChatMessage> findByChatRoomOrderByTimestampAsc(ChatRoom chatRoom);

    /**
     * Find the latest message in a chat room for dashboard preview
     */
    ChatMessage findFirstByChatRoomOrderByTimestampDesc(ChatRoom chatRoom);

    /**
     * Newest-first page.
     */
    List<ChatMessage> findByChatRoomOrderByTimestampDesc(ChatRoom chatRoom, Pageable pageable);

    /**
     * Newest-first page of messages strictly older than the cursor.
     */
    List<ChatMessage> findByChatRoomAndTimestampBeforeOrderByTimestampDesc(ChatRoom chatRoom, LocalDateTime before, Pageable pageable);
}
