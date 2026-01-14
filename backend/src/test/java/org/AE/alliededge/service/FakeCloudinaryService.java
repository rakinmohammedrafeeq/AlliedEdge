package org.AE.alliededge.service;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

/**
 * Test-double for CloudinaryService so integration tests don't require real Cloudinary credentials.
 */
public class FakeCloudinaryService implements CloudinaryService {

    @Override
    public String uploadFile(MultipartFile file, String folder) {
        String name = file != null ? file.getOriginalFilename() : "file";
        return "https://example.test/" + folder + "/" + (name != null ? name : "file");
    }

    @Override
    public String uploadMedia(MultipartFile file) {
        return uploadFile(file, "media");
    }

    @Override
    public Map<String, String> uploadRawFile(MultipartFile file, String folder) {
        return Map.of(
                "url", uploadFile(file, folder),
                "publicId", folder + "/" + (file != null ? file.getOriginalFilename() : "file"),
                "resourceType", "raw"
        );
    }

    @Override
    public String getRawUrlFromPublicId(String publicId) {
        return "https://example.test/raw/" + publicId;
    }

    @Override
    public void streamResumeToResponse(String resumeUrl, String filename, HttpServletResponse response) throws IOException {
        throw new UnsupportedOperationException("Not needed for these tests");
    }

    @Override
    public InputStream streamResume(String publicId) throws IOException {
        throw new UnsupportedOperationException("Not needed for these tests");
    }

    @Override
    public void deleteMediaByUrl(String url) {
        // no-op
    }

    @Override
    public void deleteByPublicId(String publicId, String resourceType) {
        // no-op
    }

    @Override
    public String uploadVideo(MultipartFile file, String folder) throws IOException {
        return uploadFile(file, folder);
    }

    @Override
    public void deleteVideoByPublicId(String publicId) {
        // no-op
    }

    @Override
    public void deleteImageByPublicId(String publicId) {
        // no-op
    }

    @Override
    public String extractPublicId(String url) {
        if (url == null) return null;
        // Not needed in tests; provide a minimal stub.
        return url;
    }

    @Override
    public void deleteVideo(String publicId) {
        // no-op
    }
}
