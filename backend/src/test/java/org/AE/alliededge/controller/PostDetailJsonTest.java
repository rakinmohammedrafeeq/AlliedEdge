package org.AE.alliededge.controller;

import org.AE.alliededge.model.Post;
import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.PostRepository;
import org.AE.alliededge.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PostDetailJsonTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired PostRepository postRepository;

    @Test
    void postDetail_returnsValidJson() throws Exception {
        String unique = String.valueOf(System.currentTimeMillis());

        User u = new User();
        u.setEmail("postdetail-" + unique + "@test.local");
        u.setUsername("postdetail_" + unique);
        u.setPassword("{noop}pw");
        u.setRole("ROLE_USER");
        u.setDisplayName("Post Detail");
        u.setAdmin(false);
        u.setFirstLogin(false);
        u = userRepository.save(u);

        Post p = new Post();
        p.setTitle("Hello World");
        p.setContent("Content");
        p.setCreatedAt(LocalDateTime.now());
        p.setUser(u);
        p.setAuthorName(u.getDisplayName());
        p.setAuthorIsAdmin(false);
        p = postRepository.save(p);

        mockMvc.perform(get("/api/posts/{id}", p.getId()).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }
}
