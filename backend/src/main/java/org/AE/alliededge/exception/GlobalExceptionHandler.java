package org.AE.alliededge.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public String handleResourceNotFoundException(ResourceNotFoundException ex, Model model) {
        model.addAttribute("errorMessage", ex.getMessage());
        return "error/404";
    }

    // Handle client aborts from media streaming (e.g. large Cloudinary-hosted videos) gracefully
    @ExceptionHandler(org.apache.catalina.connector.ClientAbortException.class)
    public void handleClientAbort(org.apache.catalina.connector.ClientAbortException ex,
                                  HttpServletRequest request) {
        logger.debug("ClientAbortException: {}", ex.getMessage());
        // The client closed the connection (e.g., stopped video) - not really an application error.
        logger.info("Client aborted connection while handling URI={}", request.getRequestURI());
        // Do not attempt to render a view or write to the response; just swallow.
    }

    @ExceptionHandler(Exception.class)
    public Object handleGenericException(Exception ex, Model model,
                                         HttpServletRequest request,
                                         HttpServletResponse response) {
        final String uri = request.getRequestURI();
        logger.error("An unexpected error occurred at URI=" + uri, ex);

        // For API calls, never render Thymeleaf HTML.
        // Let RestControllerAdvice handlers (ApiExceptionHandler) produce a structured JSON body.
        if (uri != null && uri.startsWith("/api/")) {
            // Re-throw to let ApiExceptionHandler (or Spring) handle it.
            if (ex instanceof RuntimeException re) {
                throw re;
            }
            throw new RuntimeException(ex);
        }

        // If the response is already committed (e.g., while streaming a file),
        // we cannot render an error view. Just log and return null.
        if (response.isCommitted()) {
            logger.warn("Response already committed for URI={}, skipping error view rendering", uri);
            return null;
        }

        model.addAttribute("errorMessage", "An unexpected error occurred. Please try again later.");
        model.addAttribute("path", uri);
        return "error/generic-error";
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public String handleMaxSizeException(MaxUploadSizeExceededException exc, RedirectAttributes redirectAttributes) {
        String detail = exc.getMessage(); // ensure parameter referenced
        logger.warn("File upload exceeded max size: " + detail);
        redirectAttributes.addFlashAttribute("message", "\u26a0\ufe0f File too large! Please upload a smaller image or video.");
        return "redirect:/admin/posts/new";
    }
}