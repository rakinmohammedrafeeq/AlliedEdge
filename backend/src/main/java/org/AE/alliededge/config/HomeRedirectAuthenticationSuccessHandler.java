package org.AE.alliededge.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Custom AuthenticationSuccessHandler that ALWAYS redirects to "/" after
 * a successful login (form or OAuth2).
 */
@Component
public class HomeRedirectAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        // Clear any saved request or previous attributes to avoid default redirect behaviour
        request.getSession(false);

        // Always redirect to feed page
        response.sendRedirect("/posts");
    }
}
