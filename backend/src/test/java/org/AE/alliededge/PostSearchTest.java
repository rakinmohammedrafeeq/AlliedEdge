package org.AE.alliededge;

import org.AE.alliededge.model.Post;
import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.PostRepository;
import org.AE.alliededge.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PostSearchTest {

    @Autowired private UserRepository userRepository;
    @Autowired private PostRepository postRepository;

    @Test
    @Transactional
    void searchShouldFindExactTitleIncludingDigits() {
        User u = new User();
        u.setEmail("search-test@example.com");
        u.setUsername("searchtest");
        u.setPassword("{noop}x");
        u.setRole("ROLE_AUTHOR");
        u.setAdmin(false);
        u.setDisplayName("Search Test");
        u.setStatus("ACTIVE");
        u.setBanned(false);
        u.setFirstLogin(false);
        userRepository.save(u);

        Post p = new Post();
        p.setTitle("title1");
        p.setContent("hello world");
        p.setUser(u);
        p.setCreatedAt(LocalDateTime.now());
        postRepository.save(p);

        Page<Post> found = postRepository.searchAllPosts("title1", PageRequest.of(0, 10));
        assertTrue(found.getTotalElements() >= 1, "Expected to find at least one post by exact keyword 'title1'");
        assertTrue(found.getContent().stream().anyMatch(x -> "title1".equalsIgnoreCase(x.getTitle())), "Expected title1 to be returned");

        Page<Post> foundWithWhitespace = postRepository.searchAllPosts(" title1 \n", PageRequest.of(0, 10));
        // Repository doesn't trim: service/controller must. So this should typically NOT match.
        // We assert the DB query itself works for exact keyword; trimming is handled earlier.
        assertNotNull(foundWithWhitespace);
    }
}

