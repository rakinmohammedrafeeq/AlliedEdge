package org.AE.alliededge.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    private final CustomOAuth2UserService customOAuth2UserService;
    private final FrontendRedirectAuthenticationSuccessHandler frontendRedirectAuthenticationSuccessHandler;
    private final CorsConfigurationSource corsConfigurationSource;

    private final String frontendRedirectUrl;

    public SecurityConfig(CustomOAuth2UserService customOAuth2UserService,
                          FrontendRedirectAuthenticationSuccessHandler frontendRedirectAuthenticationSuccessHandler,
                          CorsConfigurationSource corsConfigurationSource,
                          @Value("${app.frontend.redirect-url:http://localhost:5173/}") String frontendRedirectUrl) {
        this.customOAuth2UserService = customOAuth2UserService;
        this.frontendRedirectAuthenticationSuccessHandler = frontendRedirectAuthenticationSuccessHandler;
        this.corsConfigurationSource = corsConfigurationSource;
        this.frontendRedirectUrl = frontendRedirectUrl;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Ensure Spring Security uses the SAME CORS config as the MVC layer.
            .cors(cors -> cors.configurationSource(corsConfigurationSource))

            // Session-based auth: Authentication is stored in HttpSession (JSESSIONID).
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

            // CSRF:
            // Enable CSRF with cookie-based tokens for the SPA. Frontend calls GET /api/csrf to obtain XSRF-TOKEN cookie.
            // Keep WS endpoints ignored.
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringRequestMatchers("/ws/**")
                .ignoringRequestMatchers("/api/**")
            )

            .exceptionHandling(ex -> ex
                // Keep API responses clean and not tied to OAuth provider wording.
                .authenticationEntryPoint((request, response, authException) -> {
                    String uri = request.getRequestURI();
                    if (uri != null && (uri.startsWith("/api/") || uri.startsWith("/ws/"))) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                        response.getWriter().write("{\"error\":\"unauthorized\"}");
                    } else {
                        response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
                    }
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    String uri = request.getRequestURI();
                    if (uri != null && (uri.startsWith("/api/") || uri.startsWith("/ws/"))) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                        response.getWriter().write("{\"error\":\"forbidden\"}");
                    } else {
                        response.sendError(HttpServletResponse.SC_FORBIDDEN);
                    }
                })
            )

            .authorizeHttpRequests(auth -> auth
                // Always allow CORS preflight.
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // WebSocket / SockJS endpoints (chat + posts). Must be public for handshake/transport.
                .requestMatchers("/ws/**").permitAll()

                // Public pages + static
                .requestMatchers(
                    "/", "/home", "/register", "/login", "/oauth2/**", "/login/oauth2/**",
                    "/css/**", "/js/**", "/images/**", "/favicon.ico", "/error"
                ).permitAll()

                // SPA session probes + CSRF bootstrap
                .requestMatchers("/api/auth/status").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/csrf").permitAll()

                // --- API auth rules ---
                // Public reads
                .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
                // Mutations require an authenticated session
                .requestMatchers(HttpMethod.POST, "/api/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/**").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/api/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/**").authenticated()

                // Server-rendered MVC endpoints (keep existing behavior)
                .requestMatchers(HttpMethod.GET, "/posts", "/posts/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/posts/*/like").authenticated()
                .requestMatchers(HttpMethod.POST, "/posts/*/comments").hasAnyRole("USER", "AUTHOR", "ADMIN")
                .requestMatchers("/author/**").hasAnyRole("AUTHOR", "ADMIN")
                .requestMatchers("/admin/**").hasRole("ADMIN")

                .anyRequest().permitAll()
            )

            .formLogin(form -> form
                .loginPage("/login")
                .successHandler(frontendRedirectAuthenticationSuccessHandler)
                .permitAll()
            )

            // Backend-owned login flow.
            .oauth2Login(oauth -> oauth
                .loginPage("/login")
                .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                .successHandler(frontendRedirectAuthenticationSuccessHandler)
                .failureHandler((request, response, exception) -> {
                    String code = "login_failed";

                    if (exception instanceof OAuth2AuthenticationException oae) {
                        // Prefer error code when present; fall back to message.
                        String errCode = (oae.getError() != null) ? oae.getError().getErrorCode() : null;
                        String msg = oae.getMessage();
                        String combined = ((errCode == null ? "" : errCode) + " " + (msg == null ? "" : msg)).toUpperCase();

                        if (combined.contains("ACCOUNT_BANNED")) {
                            code = "banned";
                        }

                        log.warn("OAuth2 login failed: code={}, errCode={}, message={} ", code, errCode, msg);
                    } else {
                        log.warn("OAuth2 login failed: code={}, exceptionType={}, message={}", code,
                                exception == null ? null : exception.getClass().getName(),
                                exception == null ? null : exception.getMessage());
                    }

                    // Always redirect to SPA login (not backend /login)
                    String base = (frontendRedirectUrl == null || frontendRedirectUrl.isBlank())
                            ? "http://localhost:5173/"
                            : frontendRedirectUrl;

                    if (!base.endsWith("/")) base = base + "/";

                    String redirectTo = base + "login?error=" + code;
                    log.warn("OAuth2 failure redirect -> {}", redirectTo);

                    response.sendRedirect(redirectTo);
                })
            )

            .logout(logout -> logout
                .logoutSuccessUrl("/")
                .permitAll()
            );

        return http.build();
    }
}
