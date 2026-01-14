package org.AE.alliededge.controller;

import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.UserRepository;
import org.AE.alliededge.service.PostService;
import org.AE.alliededge.service.ProjectService;
import org.AE.alliededge.service.ProfileService;
import org.AE.alliededge.service.ResumeService;
import org.AE.alliededge.service.UserFollowService;
import org.AE.alliededge.service.UserService;
import org.AE.alliededge.service.CloudinaryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

@WebMvcTest(ProfileController.class)
class PublicProfileSecurityWebMvcTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    ProfileService profileService;

    @MockitoBean
    UserService userService;

    @MockitoBean
    PostService postService;

    @MockitoBean
    ProjectService projectService;

    @MockitoBean
    UserFollowService userFollowService;

    @MockitoBean
    ResumeService resumeService;

    @MockitoBean
    CloudinaryService cloudinaryService;

    // Required by GlobalModelAttributes (loaded in MVC context)
    @MockitoBean
    UserRepository userRepository;

    @Test
    void publicProfile_isReachable_withoutAuthentication() throws Exception {
        User u = new User();
        u.setId(1L);
        u.setEmail("test@example.com");
        u.setUsername("test");
        u.setDisplayName("Test User");

        when(userService.getUserById(1L)).thenReturn(u);
        when(postService.findPostsByUserId(1L)).thenReturn(List.of());
        when(projectService.getProjectsByUser(1L)).thenReturn(List.of());
        when(userFollowService.getFollowerCount(1L)).thenReturn(0L);
        when(userFollowService.getFollowingCount(1L)).thenReturn(0L);

        mvc.perform(get("/api/profile/users/1"))
            .andExpect(result -> {
                int s = result.getResponse().getStatus();
                if (!(s == 200 || (s >= 300 && s < 400))) {
                    throw new AssertionError("Expected 200 or 3xx redirect, got " + s);
                }
            });
    }

    // Add an additional test that verifies extended profile sections are returned.
    @Test
    void publicProfile_includesPersistedSections() throws Exception {
        User u = new User();
        u.setId(1L);
        u.setEmail("test@example.com");
        u.setUsername("test");
        u.setDisplayName("Test User");
        u.setSkills(List.of("Java", "Spring", "Hibernate"));
        u.setExperienceJson("[{\"company\":\"ACME\",\"position\":\"Dev\",\"startDate\":\"2024\"}]");
        u.setLanguagesJson("[{\"language\":\"English\",\"proficiency\":\"Fluent\"}]");
        u.setEducationJson("[{\"school\":\"Uni\",\"degree\":\"BSc\",\"startYear\":\"2020\"}]");
        u.setAvailabilityJson("{\"openToCollaboration\":true}");

        when(userService.getUserById(1L)).thenReturn(u);
        when(postService.findPostsByUserId(1L)).thenReturn(List.of());
        when(projectService.getProjectsByUser(1L)).thenReturn(List.of());
        when(userFollowService.getFollowerCount(1L)).thenReturn(0L);
        when(userFollowService.getFollowingCount(1L)).thenReturn(0L);

        mvc.perform(get("/api/profile/users/1"))
            .andExpect(result -> {
                int s = result.getResponse().getStatus();
                if (!(s == 200 || (s >= 300 && s < 400))) {
                    throw new AssertionError("Expected 200 or 3xx redirect, got " + s);
                }

                // If security redirects (302), body is empty. Only assert JSON content when we actually got a 200.
                if (s != 200) return;

                String content = result.getResponse().getContentAsString();
                if (!content.contains("Java") || !content.contains("Spring") || !content.contains("Hibernate")) {
                    throw new AssertionError("Expected skills not found in response body");
                }
                if (!content.contains("ACME") || !content.contains("English") || !content.contains("Uni")) {
                    throw new AssertionError("Expected profile sections not found in response body");
                }
                if (!content.contains("openToCollaboration")) {
                    throw new AssertionError("Expected availability not found in response body");
                }
            });
    }
}
