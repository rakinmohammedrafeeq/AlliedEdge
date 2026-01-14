package org.AE.alliededge.service;

import org.AE.alliededge.model.ChatMessage;
import org.AE.alliededge.model.ChatRoom;
import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.ChatMessageRepository;
import org.AE.alliededge.repository.ChatRoomRepository;
import org.AE.alliededge.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    public ChatService(ChatRoomRepository chatRoomRepository,
            ChatMessageRepository chatMessageRepository,
            UserRepository userRepository) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get or create a chat room between two users
     */
    @Transactional
    public ChatRoom getOrCreateChatRoom(User user1, User user2) {
        return chatRoomRepository.findByUsers(user1, user2)
                .orElseGet(() -> {
                    ChatRoom newRoom = new ChatRoom();
                    newRoom.setUser1(user1);
                    newRoom.setUser2(user2);
                    return chatRoomRepository.save(newRoom);
                });
    }

    /**
     * Send a message in a chat room
     */
    @Transactional
    public ChatMessage sendMessage(Long roomId, User sender, String content) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Chat room not found"));

        if (!room.isParticipant(sender)) {
            throw new IllegalArgumentException("User is not a participant in this chat room");
        }

        ChatMessage message = new ChatMessage();
        message.setChatRoom(room);
        message.setSender(sender);
        message.setContent(content);

        return chatMessageRepository.save(message);
    }

    /**
     * Get all messages in a chat room
     */
    public List<ChatMessage> getMessages(Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Chat room not found"));

        return chatMessageRepository.findByChatRoomOrderByTimestampAsc(room);
    }

    /**
     * Check if a user can access a chat room
     */
    public boolean canUserAccessRoom(User user, Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
        if (room == null) {
            return false;
        }
        return room.isParticipant(user);
    }

    /**
     * Get chat room by ID
     */
    public ChatRoom getChatRoom(Long roomId) {
        return chatRoomRepository.findById(roomId).orElse(null);
    }

    /**
     * Get all chat rooms for a user
     */
    public List<ChatRoom> getChatRoomsForUser(User user) {
        return chatRoomRepository.findChatRoomsForUser(user);
    }

    /**
     * Get the latest message in a chat room
     */
    public ChatMessage getLatestMessage(ChatRoom room) {
        return chatMessageRepository.findFirstByChatRoomOrderByTimestampDesc(room);
    }

    /**
     * Get the other user in a chat room
     */
    public User getOtherUser(ChatRoom room, User currentUser) {
        if (room.getUser1().getId().equals(currentUser.getId())) {
            return room.getUser2();
        } else {
            return room.getUser1();
        }
    }

    /**
     * Get newest messages in a chat room (page).
     */
    public List<ChatMessage> getRecentMessages(Long roomId, int size) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Chat room not found"));

        int safeSize = Math.max(1, Math.min(size, 200));
        Pageable pageable = PageRequest.of(0, safeSize);
        return chatMessageRepository.findByChatRoomOrderByTimestampDesc(room, pageable);
    }

    /**
     * Get older messages strictly before the given timestamp (page), newest-first.
     */
    public List<ChatMessage> getOlderMessages(Long roomId, LocalDateTime before, int size) {
        if (before == null) {
            return Collections.emptyList();
        }

        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Chat room not found"));

        int safeSize = Math.max(1, Math.min(size, 200));
        Pageable pageable = PageRequest.of(0, safeSize);
        return chatMessageRepository.findByChatRoomAndTimestampBeforeOrderByTimestampDesc(room, before, pageable);
    }
}
