package org.AE.alliededge.controller;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * CSRF bootstrap endpoint for the SPA.
 *
 * Spring Security will create/populate the XSRF-TOKEN cookie (CookieCsrfTokenRepository)
 * when this endpoint is hit. The frontend can call it once on app start (or before the
 * first unsafe request) to ensure subsequent POST/PUT/DELETE requests include the
 * X-CSRF-TOKEN header.
 */
@RestController
@RequestMapping("/api")
public class CsrfController {

    @GetMapping("/csrf")
    public Map<String, Object> csrf(CsrfToken token) {
        return Map.of(
                "headerName", token.getHeaderName(),
                "parameterName", token.getParameterName(),
                "token", token.getToken()
        );
    }
}

