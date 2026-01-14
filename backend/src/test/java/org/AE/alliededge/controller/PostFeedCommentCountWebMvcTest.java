package org.AE.alliededge.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.AE.alliededge.model.Comment;
import org.AE.alliededge.model.Post;
import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.CommentRepository;
import org.AE.alliededge.repository.PostRepository;
import org.AE.alliededge.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PostFeedCommentCountWebMvcTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;

    @Autowired UserRepository userRepository;
    @Autowired PostRepository postRepository;
    @Autowired CommentRepository commentRepository;

    @Test
    void postsFeed_includesCommentCount() throws Exception {
        // Arrange: create a user + post + 2 comments
        String unique = String.valueOf(System.currentTimeMillis());
        User u = new User();
        u.setEmail("feedcount-" + unique + "@test.local");
        u.setUsername("feedcount_user_" + unique);
        u.setPassword("x");
        u.setRole("ROLE_USER");
        u.setAdmin(false);
        u.setFirstLogin(false);
        u = userRepository.save(u);

        Post p = new Post();
        p.setUser(u);
        p.setAuthorName("Feed Count");
        p.setAuthorIsAdmin(false);
        p.setTitle("title1");
        p.setContent("hello");
        p.setCreatedAt(LocalDateTime.now());
        p.setLikes(0);
        p.setViews(0);
        p = postRepository.save(p);

        Comment c1 = new Comment();
        c1.setPost(p);
        c1.setUser(u);
        c1.setContent("c1");
        c1.setCreatedAt(LocalDateTime.now());
        commentRepository.save(c1);

        Comment c2 = new Comment();
        c2.setPost(p);
        c2.setUser(u);
        c2.setContent("c2");
        c2.setCreatedAt(LocalDateTime.now());
        commentRepository.save(c2);

        // Act
        String json = mvc.perform(get("/api/posts")
                        .param("page", "0")
                        .param("size", "5")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Assert: ensure commentCount field exists and equals 2 for our post
        var root = objectMapper.readTree(json);
        var content = root.path("postPage").path("content");
        assertThat(content.isArray()).isTrue();

        boolean found = false;
        for (var item : content) {
            if (item.path("id").asLong() == p.getId()) {
                found = true;
                assertThat(item.has("commentCount")).isTrue();
                assertThat(item.path("commentCount").asInt()).isEqualTo(2);
            }
        }
        assertThat(found).isTrue();
    }
}
