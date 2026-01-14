package org.AE.alliededge.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * After a successful login (form or OAuth2), redirect the user back to the frontend.
 *
 * Frontend only needs to hit /oauth2/authorization/google. The backend completes
 * the OAuth2 flow and then redirects to the SPA.
 */
@Component
public class FrontendRedirectAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final String frontendRedirectUrl;

    public FrontendRedirectAuthenticationSuccessHandler(
            @Value("${app.frontend.redirect-url:http://localhost:5173/}") String frontendRedirectUrl
    ) {
        this.frontendRedirectUrl = frontendRedirectUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        // Ensure the session exists so Spring Security can store the Authentication
        request.getSession(true);

        // Redirect back to the SPA. From there you can call backend APIs with cookies (credentials: 'include').
        response.sendRedirect(frontendRedirectUrl);
    }
}

