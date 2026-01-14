package org.AE.alliededge.controller;

import org.AE.alliededge.config.TestCloudinaryConfig;
import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestCloudinaryConfig.class)
class UserSearchExcludesSelfWebMvcTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    UserRepository userRepository;

    private User me;

    @BeforeEach
    void setup() {
        String suffix = UUID.randomUUID().toString().replace("-", "");

        me = new User();
        me.setEmail("me+" + suffix + "@example.com");
        me.setUsername("me_" + suffix);
        me.setPassword("password");
        me.setRole("ROLE_USER");
        me.setAdmin(false);
        me.setDisplayName("Me");
        userRepository.save(me);

        User other = new User();
        other.setEmail("other+" + suffix + "@example.com");
        other.setUsername("other_" + suffix);
        other.setPassword("password");
        other.setRole("ROLE_USER");
        other.setAdmin(false);
        other.setDisplayName("Other");
        userRepository.save(other);
    }

    @Test
    void searchUsers_doesNotReturnCurrentUser() throws Exception {
        String body = mockMvc.perform(
                        get("/api/users/search")
                                .param("keyword", "me_")
                                .with(user(me.getEmail()))
                )
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // If the API returns full User entities, this will contain many fields.
        // We only care that the current user's id/username doesn't appear anywhere.
        assertThat(body).doesNotContain("\"id\":" + me.getId());
        assertThat(body).doesNotContain(me.getUsername());
    }
}

