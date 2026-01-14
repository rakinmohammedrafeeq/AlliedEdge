package org.AE.alliededge.controller;

import org.AE.alliededge.model.ChatRoom;
import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.UserRepository;
import org.AE.alliededge.service.ChatService;
import org.AE.alliededge.service.UserFollowService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ChatPaginationWebMvcTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private ChatService chatService;
    @Autowired private UserFollowService userFollowService;

    @Test
    @WithMockUser(username = "alice@example.com")
    void listMessagesPaged_returns200_andMessagesArray() throws Exception {
        final String suffix = UUID.randomUUID().toString().substring(0, 8);
        final String aliceEmail = "alice+" + suffix + "@example.com";
        final String bobEmail = "bob+" + suffix + "@example.com";
        final String aliceUsername = "alice_" + suffix;
        final String bobUsername = "bob_" + suffix;

        // Create two users
        User alice = new User();
        alice.setEmail(aliceEmail);
        alice.setUsername(aliceUsername);
        alice.setPassword("x");
        alice.setRole("ROLE_USER");
        alice.setAdmin(false);
        alice.setFirstLogin(false);
        userRepository.save(alice);

        User bob = new User();
        bob.setEmail(bobEmail);
        bob.setUsername(bobUsername);
        bob.setPassword("x");
        bob.setRole("ROLE_USER");
        bob.setAdmin(false);
        bob.setFirstLogin(false);
        userRepository.save(bob);

        // Mutual follow
        userFollowService.followUser(alice.getEmail(), bob.getId());
        userFollowService.followUser(bob.getEmail(), alice.getId());

        // Create room and send a message
        ChatRoom room = chatService.getOrCreateChatRoom(alice, bob);
        chatService.sendMessage(room.getId(), alice, "hello");

        mockMvc.perform(get("/api/chats/{roomId}/messages", room.getId())
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(aliceEmail).roles("USER"))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages").isArray())
                .andExpect(jsonPath("$.hasMore").exists());
    }
}
