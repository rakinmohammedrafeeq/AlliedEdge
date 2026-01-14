package org.AE.alliededge.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    /**
     * Comma-separated list of allowed origins.
     * Example: http://localhost:5173,http://127.0.0.1:5173
     *
     * Why this is needed now:
     * - With Thymeleaf, the browser loaded pages and called endpoints from the SAME origin as the backend,
     *   so cookies (JSESSIONID) were sent automatically and the browser didn't enforce CORS.
     * - With a React SPA on a DIFFERENT origin (http://localhost:5173), the browser blocks cross-origin
     *   requests unless the backend explicitly allows them via CORS.
     * - Because auth is session-based, the SPA must be allowed to send cookies; that requires
     *   allowCredentials(true) AND an explicit (non-"*") allowed origin.
     */
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split("\\s*,\\s*"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .toList();

        // NOTE: When allowCredentials(true), you must NOT use "*" for allowed origins.
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));

        // Cookies (JSESSIONID) + CSRF cookie/header will be used by the SPA.
        // Without allowCredentials(true), browsers will omit cookies on cross-origin XHR/fetch.
        config.setAllowCredentials(true);

        // Useful for debugging / integrating CSRF with SPA.
        config.setExposedHeaders(List.of("Location", "Set-Cookie", "X-CSRF-TOKEN"));

        // Cache preflight responses in browsers.
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply to all paths so session login/logout and API calls work cross-origin.
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
