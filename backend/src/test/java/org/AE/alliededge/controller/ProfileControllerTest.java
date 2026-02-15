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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestCloudinaryConfig.class)
class ProfileControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    UserRepository userRepository;

    private String testEmail;

    @BeforeEach
    void setup() {
        // Don't wipe the DB here: other tests may have inserted rows referencing users (FK constraints).
        // Instead, create a unique user for each test run.
        String suffix = UUID.randomUUID().toString().replace("-", "");
        testEmail = "me+" + suffix + "@example.com";
        User u = new User();
        u.setEmail(testEmail);
        u.setUsername("me_" + suffix);
        u.setPassword("password");
        u.setRole("ROLE_USER");
        u.setAdmin(false);
        u.setDisplayName("Me");
        u.setBio("Old bio");
        userRepository.save(u);
    }

    @Test
    void updateProfile_persistsChanges_andDoesNotNullOutMissingFields() throws Exception {
        mockMvc.perform(
                        multipart("/api/profile")
                                .with(req -> {
                                    req.setMethod("PUT");
                                    return req;
                                })
                                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(testEmail))
                                .with(csrf())
                                .param("displayName", "New Name")
                                // bio intentionally omitted; should stay "Old bio"
                                .param("removeProfileImage", "false")
                )
                .andExpect(status().isOk());

        User saved = userRepository.findByEmail(testEmail).orElseThrow();
        assertThat(saved.getDisplayName()).isEqualTo("New Name");
        assertThat(saved.getBio()).isEqualTo("Old bio");
    }

    @Test
    void updateProfile_invalidUsername_returns400() throws Exception {
        mockMvc.perform(
                        multipart("/api/profile")
                                .with(req -> {
                                    req.setMethod("PUT");
                                    return req;
                                })
                                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(testEmail))
                                .with(csrf())
                                .param("username", "bad@name")
                                .param("removeProfileImage", "false")
                )
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateProfile_canSetAndRemoveBannerImageUrl() throws Exception {
        // Set banner (simulate with a real image part; service will validate content-type and non-empty)
        mockMvc.perform(
                        multipart("/api/profile")
                                .file(new org.springframework.mock.web.MockMultipartFile(
                                        "bannerImageFile",
                                        "banner.png",
                                        "image/png",
                                        new byte[]{1, 2, 3}
                                ))
                                .with(req -> {
                                    req.setMethod("PUT");
                                    return req;
                                })
                                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(testEmail))
                                .with(csrf())
                                .param("removeBannerImage", "false")
                                .param("removeProfileImage", "false")
                )
                .andExpect(status().isOk());

        User afterUpload = userRepository.findByEmail(testEmail).orElseThrow();
        // We can't assert the exact Cloudinary URL without mocking; just assert it's non-blank.
        assertThat(afterUpload.getBannerImageUrl()).isNotBlank();

        // Remove banner
        mockMvc.perform(
                        multipart("/api/profile")
                                .with(req -> {
                                    req.setMethod("PUT");
                                    return req;
                                })
                                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(testEmail))
                                .with(csrf())
                                .param("removeBannerImage", "true")
                                .param("removeProfileImage", "false")
                )
                .andExpect(status().isOk());

        User afterRemove = userRepository.findByEmail(testEmail).orElseThrow();
        assertThat(afterRemove.getBannerImageUrl()).isNull();
    }

    @Test
    void updateProfile_persistsExtendedFields() throws Exception {
        mockMvc.perform(
                        multipart("/api/profile")
                                .with(req -> {
                                    req.setMethod("PUT");
                                    return req;
                                })
                                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(testEmail))
                                .with(csrf())
                                .param("location", "Melbourne")
                                .param("twitter", "https://twitter.com/example")
                                .param("skillsJson", "[\"Java\",\"React\"]")
                                .param("experienceJson", "[{\"company\":\"ACME\",\"position\":\"Dev\",\"startDate\":\"2024\"}]")
                                .param("languagesJson", "[{\"language\":\"English\",\"proficiency\":\"Fluent\"}]")
                                .param("educationJson", "[{\"school\":\"Uni\",\"degree\":\"BSc\",\"startYear\":\"2020\"}]")
                                .param("availabilityJson", "{\"openToCollaboration\":true}")
                                .param("projectsJson", "[{\"title\":\"Proj\",\"summary\":\"S\",\"status\":\"Building\",\"problem\":\"P\",\"built\":\"B\",\"role\":\"R\",\"techStack\":[\"Java\"],\"proofLinks\":{\"github\":\"https://github.com/x\"}}]")
                                .param("removeProfileImage", "false")
                                .param("removeBannerImage", "false")
                )
                .andExpect(status().isOk());

        User saved = userRepository.findByEmail(testEmail).orElseThrow();
        assertThat(saved.getLocation()).isEqualTo("Melbourne");
        assertThat(saved.getTwitter()).isEqualTo("https://twitter.com/example");
        assertThat(saved.getSkills()).containsExactly("Java", "React");
        assertThat(saved.getExperienceJson()).contains("ACME");
        assertThat(saved.getLanguagesJson()).contains("English");
        assertThat(saved.getEducationJson()).contains("Uni");
        assertThat(saved.getAvailabilityJson()).contains("openToCollaboration");
    }
}
