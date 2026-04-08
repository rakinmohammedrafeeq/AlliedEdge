package org.AE.alliededge.config;

import org.AE.alliededge.service.CloudinaryService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

/**
 * Fallback CloudinaryService used when Cloudinary isn't configured.
 *
 * Why this exists:
 * - In production, missing CLOUDINARY_* env vars previously caused the app to fail at startup,
 *   which made Render mark the service unhealthy and Cloudflare return 521.
 * - Most endpoints (reading posts, auth status, etc.) don't require Cloudinary.
 *
 * With this fallback, the app can start and serve non-upload features. Any endpoint that
 * actually needs Cloudinary will fail fast with a clear error message.
 */
@Configuration
public class NoopCloudinaryServiceConfig {

    private static final String MESSAGE =
            "Cloudinary is not configured on this server. Set CLOUDINARY_CLOUD_NAME, " +
            "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (or enable Cloudinary) to use uploads.";

    @Bean
    @ConditionalOnMissingBean(CloudinaryService.class)
    public CloudinaryService cloudinaryService() {
        return new CloudinaryService() {
            private RuntimeException notConfigured() {
                return new IllegalStateException(MESSAGE);
            }

            @Override
            public String uploadFile(MultipartFile file, String folder) {
                throw notConfigured();
            }

            @Override
            public String uploadMedia(MultipartFile file) {
                throw notConfigured();
            }

            @Override
            public Map<String, String> uploadRawFile(MultipartFile file, String folder) {
                throw notConfigured();
            }

            @Override
            public String getRawUrlFromPublicId(String publicId) {
                // This helper can still return null when not configured.
                return null;
            }

            @Override
            public void streamResumeToResponse(String resumeUrl, String filename, HttpServletResponse response) throws IOException {
                throw notConfigured();
            }

            @Override
            public InputStream streamResume(String publicId) throws IOException {
                throw notConfigured();
            }

            @Override
            public void deleteMediaByUrl(String url) {
                throw notConfigured();
            }

            @Override
            public void deleteByPublicId(String publicId, String resourceType) {
                throw notConfigured();
            }

            @Override
            public String uploadVideo(MultipartFile file, String folder) throws IOException {
                throw notConfigured();
            }


            @Override
            public String extractPublicId(String url) {
                // Best-effort fallback (non-fatal); delete paths will still throw if called.
                return url;
            }

            @Override
            public void deleteVideo(String publicId) throws IOException {
                throw notConfigured();
            }
        };
    }
}

