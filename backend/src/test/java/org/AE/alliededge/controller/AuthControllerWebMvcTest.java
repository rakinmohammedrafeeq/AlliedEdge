package org.AE.alliededge.controller;

import org.AE.alliededge.repository.UserRepository;
import org.AE.alliededge.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.test.context.bean.override.mockito.MockitoBean;

@WebMvcTest(AuthController.class)
class AuthControllerWebMvcTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    UserService userService;

    @MockitoBean
    UserRepository userRepository;

    @Test
    void statusEndpoint_isReachable_withoutServerError() throws Exception {
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/auth/status"))
                .andExpect(result -> {
                    int s = result.getResponse().getStatus();
                    if (!(s == 200 || (s >= 300 && s < 400))) {
                        throw new AssertionError("Expected 200 or 3xx redirect, got " + s);
                    }
                });
    }
}
