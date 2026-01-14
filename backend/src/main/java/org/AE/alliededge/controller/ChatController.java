package org.AE.alliededge.controller;

import org.AE.alliededge.dto.ChatMessageDTO;
import org.AE.alliededge.dto.ChatRoomDTO;
import org.AE.alliededge.dto.SendChatMessageRequest;
import org.AE.alliededge.model.ChatMessage;
import org.AE.alliededge.model.ChatRoom;
import org.AE.alliededge.model.User;
import org.AE.alliededge.service.ChatService;
import org.AE.alliededge.service.UserFollowService;
import org.AE.alliededge.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final ChatService chatService;
    private final UserService userService;
    private final UserFollowService userFollowService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(ChatService chatService,
                          UserService userService,
                          UserFollowService userFollowService,
                          SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.userService = userService;
        this.userFollowService = userFollowService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Chat dashboard - list all conversations for current user
     */
    @GetMapping("/chats")
    public ResponseEntity<?> chatDashboard(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String principal = authentication.getName();
        User currentUser = userService.getUserByPrincipal(principal);

        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        List<ChatRoom> chatRooms = chatService.getChatRoomsForUser(currentUser);

        List<ChatRoomDTO> chatRoomDTOs = new ArrayList<>();
        for (ChatRoom room : chatRooms) {
            User otherUser = chatService.getOtherUser(room, currentUser);
            ChatMessage lastMessage = chatService.getLatestMessage(room);

            String lastMessageText = lastMessage != null ? lastMessage.getContent() : "No messages yet";

            ChatRoomDTO dto = new ChatRoomDTO(
                    room.getId(),
                    otherUser.getId(),
                    otherUser.getUsername(),
                    otherUser.getDisplayName() != null ? otherUser.getDisplayName() : otherUser.getUsername(),
                    otherUser.getProfileImageUrl() != null ? otherUser.getProfileImageUrl()
                            : "/images/default-profile.jpg",
                    lastMessageText,
                    lastMessage != null ? lastMessage.getTimestamp() : null);
            chatRoomDTOs.add(dto);
        }

        return ResponseEntity.ok(Map.of(
                "chatRooms", chatRoomDTOs,
                "currentUser", currentUser
        ));
    }

    /**
     * Open/get chat room + messages with a target user
     */
    @GetMapping("/chats/with/{userId}")
    public ResponseEntity<?> openChat(@PathVariable Long userId, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String principal = authentication.getName();
        User currentUser = userService.getUserByPrincipal(principal);
        User targetUser = userService.getUserById(userId);

        if (currentUser == null || targetUser == null) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        boolean followsTarget = userFollowService.isFollowing(principal, userId);
        boolean mutual = userFollowService.isMutualFollowing(principal, userId);

        // LinkedIn-style: allow opening the thread UI, but lock sending unless mutual follow.
        if (!mutual) {
            String reason;
            if (!followsTarget) {
                reason = "FOLLOW_REQUIRED";
            } else {
                reason = "FOLLOW_BACK_REQUIRED";
            }

            return ResponseEntity.status(403).body(Map.of(
                    "message", "Messaging is locked until you both follow each other",
                    "canMessage", false,
                    "reason", reason,
                    "targetUser", targetUser,
                    "currentUser", currentUser
            ));
        }

        ChatRoom chatRoom = chatService.getOrCreateChatRoom(currentUser, targetUser);
        List<ChatMessage> messages = chatService.getMessages(chatRoom.getId());

        List<ChatMessageDTO> messageDTOs = messages.stream()
                .map(msg -> new ChatMessageDTO(
                        chatRoom.getId(),
                        msg.getSender().getUsername(),
                        msg.getSender().getDisplayName() != null ? msg.getSender().getDisplayName()
                                : msg.getSender().getUsername(),
                        msg.getContent(),
                        msg.getTimestamp()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "canMessage", true,
                "chatRoom", chatRoom,
                "targetUser", targetUser,
                "currentUser", currentUser,
                "messages", messageDTOs
        ));
    }

    /**
     * Persisted send endpoint (REST).
     * This guarantees delivery (message saved to DB) even if WebSocket is blocked.
     */
    @PostMapping("/chats/{roomId}/messages")
    public ResponseEntity<?> sendMessageRest(@PathVariable Long roomId,
                                             @RequestBody SendChatMessageRequest request,
                                             Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String principal = authentication.getName();
        User sender = userService.getUserByPrincipal(principal);
        if (sender == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        ChatRoom room = chatService.getChatRoom(roomId);
        if (room == null || !room.isParticipant(sender)) {
            return ResponseEntity.status(404).body(Map.of("message", "Chat room not found"));
        }

        User otherUser = chatService.getOtherUser(room, sender);
        if (otherUser == null) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        boolean mutual = userFollowService.isMutualFollowing(principal, otherUser.getId());
        if (!mutual) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "message", "Messaging is locked until you both follow each other",
                    "canMessage", false,
                    "reason", userFollowService.isFollowing(principal, otherUser.getId()) ? "FOLLOW_BACK_REQUIRED" : "FOLLOW_REQUIRED"
            ));
        }

        String content = request != null ? request.getContent() : null;
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Message content is required"));
        }

        ChatMessage savedMessage = chatService.sendMessage(roomId, sender, content.trim());

        ChatMessageDTO response = new ChatMessageDTO(
                savedMessage.getChatRoom().getId(),
                sender.getUsername(),
                sender.getDisplayName() != null ? sender.getDisplayName() : sender.getUsername(),
                savedMessage.getContent(),
                savedMessage.getTimestamp());

        // Broadcast for realtime listeners.
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, response);

        return ResponseEntity.ok(response);
    }

    /**
     * Handle incoming WebSocket chat messages
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageDTO messageDTO, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return;
        }

        String principal = authentication.getName();
        User sender = userService.getUserByPrincipal(principal);

        if (sender == null) {
            return;
        }

        ChatRoom room = chatService.getChatRoom(messageDTO.getRoomId());
        if (room == null || !room.isParticipant(sender)) {
            return;
        }

        User otherUser = chatService.getOtherUser(room, sender);
        if (otherUser == null) {
            return;
        }

        // Server-side enforcement for WebSocket path (can't be bypassed by a custom client)
        boolean mutual = userFollowService.isMutualFollowing(principal, otherUser.getId());
        if (!mutual) {
            return;
        }

        ChatMessage savedMessage = chatService.sendMessage(
                messageDTO.getRoomId(),
                sender,
                messageDTO.getContent());

        ChatMessageDTO response = new ChatMessageDTO(
                savedMessage.getChatRoom().getId(),
                sender.getUsername(),
                sender.getDisplayName() != null ? sender.getDisplayName() : sender.getUsername(),
                savedMessage.getContent(),
                savedMessage.getTimestamp());

        messagingTemplate.convertAndSend("/topic/chat/" + messageDTO.getRoomId(), response);
    }

    /**
     * Paginated messages (newest-first). Use for infinite scroll.
     *
     * Query:
     * - size: page size (default 30)
     * - before: cursor timestamp (optional). If provided, returns messages strictly older than this timestamp.
     */
    @GetMapping("/chats/{roomId}/messages")
    public ResponseEntity<?> listMessagesPaged(@PathVariable Long roomId,
                                              @RequestParam(name = "size", required = false, defaultValue = "30") int size,
                                              @RequestParam(name = "before", required = false)
                                              @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime before,
                                              Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String principal = authentication.getName();
        User currentUser = userService.getUserByPrincipal(principal);
        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        ChatRoom room = chatService.getChatRoom(roomId);
        if (room == null || !room.isParticipant(currentUser)) {
            return ResponseEntity.status(404).body(Map.of("message", "Chat room not found"));
        }

        User otherUser = chatService.getOtherUser(room, currentUser);
        if (otherUser == null) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        // Enforce mutual follow to read messages (same gate as sending/opening).
        boolean mutual = userFollowService.isMutualFollowing(principal, otherUser.getId());
        if (!mutual) {
            String reason = userFollowService.isFollowing(principal, otherUser.getId()) ? "FOLLOW_BACK_REQUIRED" : "FOLLOW_REQUIRED";
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "message", "Messaging is locked until you both follow each other",
                    "canMessage", false,
                    "reason", reason
            ));
        }

        // We intentionally fetch one extra record (size+1) so we can compute hasMore reliably.
        int safeSize = Math.max(1, Math.min(size, 200));
        int fetchSize = Math.min(201, safeSize + 1);

        List<ChatMessage> fetched;
        if (before != null) {
            fetched = chatService.getOlderMessages(roomId, before, fetchSize);
        } else {
            fetched = chatService.getRecentMessages(roomId, fetchSize);
        }

        boolean hasMore = fetched.size() > safeSize;
        List<ChatMessage> page = hasMore ? fetched.subList(0, safeSize) : fetched;

        // Returned newest-first; frontend will reverse for display.
        List<ChatMessageDTO> messageDTOs = page.stream()
                .map(msg -> new ChatMessageDTO(
                        room.getId(),
                        msg.getSender().getUsername(),
                        msg.getSender().getDisplayName() != null ? msg.getSender().getDisplayName() : msg.getSender().getUsername(),
                        msg.getContent(),
                        msg.getTimestamp()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "messages", messageDTOs,
                "hasMore", hasMore
        ));
    }
}
