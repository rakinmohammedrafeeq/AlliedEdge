package org.AE.alliededge.controller;

import org.AE.alliededge.config.TestCloudinaryConfig;
import org.AE.alliededge.model.User;
import org.AE.alliededge.model.UserFollow;
import org.AE.alliededge.repository.UserFollowRepository;
import org.AE.alliededge.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestCloudinaryConfig.class)
class ChatMutualFollowSecurityTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserFollowRepository userFollowRepository;

    private User newUser(String email, String username) {
        User u = new User();
        u.setEmail(email);
        u.setUsername(username);
        u.setPassword("password");
        u.setRole("ROLE_USER");
        u.setAdmin(false);
        u.setDisplayName(username);
        return userRepository.save(u);
    }

    @Test
    void openChat_requiresMutualFollow() throws Exception {
        long n = System.nanoTime();
        String aEmail = "a+" + n + "@example.com";
        String bEmail = "b+" + (n + 1) + "@example.com";

        User a = newUser(aEmail, "a" + n);
        User b = newUser(bEmail, "b" + (n + 1));

        // A follows B only (one-way)
        UserFollow aFollowsB = new UserFollow();
        aFollowsB.setFollower(a);
        aFollowsB.setFollowing(b);
        userFollowRepository.save(aFollowsB);

        mockMvc.perform(get("/api/chats/with/{id}", b.getId()).with(user(aEmail)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.canMessage").value(false))
                .andExpect(jsonPath("$.reason").value("FOLLOW_BACK_REQUIRED"));

        // B follows A -> mutual
        UserFollow bFollowsA = new UserFollow();
        bFollowsA.setFollower(b);
        bFollowsA.setFollowing(a);
        userFollowRepository.save(bFollowsA);

        mockMvc.perform(get("/api/chats/with/{id}", b.getId()).with(user(aEmail)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canMessage").value(true))
                .andExpect(jsonPath("$.chatRoom.id").exists());
    }

    @Test
    void openChat_allowsMutualFollow_whenPrincipalIsUsername() throws Exception {
        long n = System.nanoTime();
        String aEmail = "a2+" + n + "@example.com";
        String bEmail = "b2+" + (n + 1) + "@example.com";

        User a = newUser(aEmail, "a2" + n);
        User b = newUser(bEmail, "b2" + (n + 1));

        UserFollow aFollowsB = new UserFollow();
        aFollowsB.setFollower(a);
        aFollowsB.setFollowing(b);
        userFollowRepository.save(aFollowsB);

        UserFollow bFollowsA = new UserFollow();
        bFollowsA.setFollower(b);
        bFollowsA.setFollowing(a);
        userFollowRepository.save(bFollowsA);

        // Authenticate as username (typical form-login principal)
        mockMvc.perform(get("/api/chats/with/{id}", b.getId()).with(user(a.getUsername())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canMessage").value(true));
    }
}
