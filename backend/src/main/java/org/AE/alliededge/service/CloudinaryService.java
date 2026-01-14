package org.AE.alliededge.service;

import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

public interface CloudinaryService {

    String uploadFile(MultipartFile file, String folder);

    String uploadMedia(MultipartFile file);

    Map<String, String> uploadRawFile(MultipartFile file, String folder);

    void deleteMediaByUrl(String url);

    default void deleteImageByPublicId(String publicId) {
        deleteByPublicId(publicId, "image");
    }

    default void deleteVideoByPublicId(String publicId) {
        deleteByPublicId(publicId, "video");
    }

    default void deleteRawFileByPublicId(String publicId) {
        deleteByPublicId(publicId, "raw");
    }

    void deleteByPublicId(String publicId, String resourceType);

    void streamResumeToResponse(String resumeUrl, String filename, HttpServletResponse response)
            throws IOException;

    String getRawUrlFromPublicId(String publicId);

    String extractPublicId(String url);

    // Stream resume PDF
    InputStream streamResume(String publicId) throws IOException;

    // Upload video to Cloudinary
    String uploadVideo(MultipartFile file, String folder) throws IOException;

    // Delete video from Cloudinary
    void deleteVideo(String publicId) throws IOException;
}
