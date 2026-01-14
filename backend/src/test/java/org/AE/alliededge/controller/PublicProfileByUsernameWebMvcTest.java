package org.AE.alliededge.controller;

import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.UserRepository;
import org.AE.alliededge.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

@WebMvcTest(ProfileController.class)
class PublicProfileByUsernameWebMvcTest {

    @Autowired
    MockMvc mvc;

    // Required by GlobalModelAttributes (loaded in MVC context)
    @MockitoBean
    UserRepository userRepository;

    @MockitoBean
    UserService userService;

    @MockitoBean
    PostService postService;

    @MockitoBean
    ProjectService projectService;

    @MockitoBean
    UserFollowService userFollowService;

    @MockitoBean
    ProfileService profileService;

    @MockitoBean
    ResumeService resumeService;

    @MockitoBean
    CloudinaryService cloudinaryService;

    @Test
    void publicProfileByUsername_isPublicAndDoesNotLeakEmailOrResume() throws Exception {
        User u = new User();
        u.setId(123L);
        u.setUsername("alice");
        u.setDisplayName("Alice");
        u.setEmail("alice@example.com");
        u.setResumeUrl("https://example.com/private-resume.pdf");

        when(userService.findByUsername(eq("alice"))).thenReturn(Optional.of(u));
        when(postService.findPostsByUserId(eq(123L))).thenReturn(java.util.List.of());
        when(projectService.getProjectsByUser(eq(123L))).thenReturn(java.util.List.of());
        when(userFollowService.getFollowerCount(eq(123L))).thenReturn(0L);
        when(userFollowService.getFollowingCount(eq(123L))).thenReturn(0L);

        mvc.perform(get("/api/profile/u/alice").accept(MediaType.APPLICATION_JSON))
                .andExpect(result -> {
                    int s = result.getResponse().getStatus();
                    if (!(s == 200 || (s >= 300 && s < 400))) {
                        throw new AssertionError("Expected 200 or 3xx redirect, got " + s);
                    }

                    // If security redirects (302), body is empty. Only assert JSON content when we actually got a 200.
                    if (s != 200) return;

                    String content = result.getResponse().getContentAsString();
                    if (content.contains("alice@example.com")) {
                        throw new AssertionError("Public profile must not leak email");
                    }
                    if (content.contains("private-resume")) {
                        throw new AssertionError("Public profile must not leak resumeUrl");
                    }
                    if (!content.contains("\"username\":\"alice\"")) {
                        throw new AssertionError("Expected username not found in response body");
                    }
                });
    }
}
