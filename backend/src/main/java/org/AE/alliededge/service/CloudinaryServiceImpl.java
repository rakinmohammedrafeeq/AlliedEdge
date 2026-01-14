package org.AE.alliededge.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

@Service
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;
    private static final Logger LOGGER = Logger.getLogger(CloudinaryServiceImpl.class.getName());

    public CloudinaryServiceImpl(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @Override
    public String uploadFile(MultipartFile file, String folder) {
        try {
            Map upload = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap("folder", folder, "resource_type", "auto"));
            return upload.get("secure_url").toString();
        } catch (Exception e) {
            throw new RuntimeException("Upload failed", e);
        }
    }

    @Override
    public String uploadMedia(MultipartFile file) {
        try {
            Map upload = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap("resource_type", "auto"));
            return upload.get("secure_url").toString();
        } catch (Exception e) {
            throw new RuntimeException("Media upload failed", e);
        }
    }

    @Override
    public Map<String, String> uploadRawFile(MultipartFile file, String folder) {
        java.io.File tempFile = null;
        try {
            String uuid = java.util.UUID.randomUUID().toString();
            String publicId = folder + "/" + uuid;

            tempFile = java.io.File.createTempFile("resume_upload_", ".pdf");
            try (java.io.InputStream inputStream = file.getInputStream();
                    java.io.FileOutputStream fos = new java.io.FileOutputStream(tempFile)) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    fos.write(buffer, 0, bytesRead);
                }
            }

            Map upload = cloudinary.uploader().upload(tempFile,
                    ObjectUtils.asMap(
                            "resource_type", "raw",
                            "folder", folder,
                            "public_id", publicId,
                            "use_filename", true,
                            "unique_filename", true,
                            "access_mode", "public",
                            "format", "pdf"));

            String secureUrl = upload.get("secure_url").toString();
            String storedPublicId = upload.get("public_id").toString();

            Map<String, String> result = new HashMap<>();
            result.put("url", secureUrl);
            result.put("publicId", storedPublicId);
            result.put("resourceType", "raw");

            LOGGER.info("Uploaded PDF: " + secureUrl + " | publicId: " + storedPublicId);

            return result;
        } catch (Exception e) {
            LOGGER.severe("Raw file upload failed: " + e.getMessage());
            throw new RuntimeException("Raw file upload failed: " + e.getMessage(), e);
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

    @Override
    public String getRawUrlFromPublicId(String publicId) {
        if (publicId == null || publicId.isEmpty()) {
            return null;
        }

        try {
            String cloudName = cloudinary.config.cloudName;
            return "https://res.cloudinary.com/" + cloudName + "/raw/upload/" + publicId + ".pdf";
        } catch (Exception e) {
            LOGGER.warning("Failed to build raw URL for publicId: " + publicId);
            return null;
        }
    }

    @Override
    public void streamResumeToResponse(String resumeUrl, String filename, HttpServletResponse response)
            throws IOException {
        if (resumeUrl == null || resumeUrl.isEmpty()) {
            throw new IllegalArgumentException("Resume URL cannot be null or empty");
        }

        try {
            java.net.URL url = new java.net.URL(resumeUrl);
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(30000);

            response.setContentType("application/pdf");
            response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

            int contentLength = connection.getContentLength();
            if (contentLength > 0) {
                response.setContentLength(contentLength);
            }

            try (java.io.InputStream in = new java.io.BufferedInputStream(connection.getInputStream());
                    java.io.OutputStream out = new java.io.BufferedOutputStream(response.getOutputStream())) {

                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
                out.flush();
            }

            LOGGER.info("Streamed resume: " + filename);
        } catch (IOException e) {
            LOGGER.severe("Failed to stream resume: " + e.getMessage());
            throw e;
        }
    }

    @Override
    public InputStream streamResume(String publicId) throws IOException {
        if (publicId == null || publicId.isEmpty()) {
            throw new IllegalArgumentException("Public ID cannot be null or empty");
        }

        try {
            String urlString = cloudinary.url()
                    .resourceType("raw")
                    .publicId(publicId)
                    .generate();

            return new URL(urlString).openStream();
        } catch (Exception e) {
            throw new IOException("Failed to stream resume: " + e.getMessage(), e);
        }
    }

    public String extractPublicId(String url) {
        try {
            String noQuery = url.split("\\?")[0];
            String[] parts = noQuery.split("/");

            String fileName = parts[parts.length - 1];
            fileName = fileName.substring(0, fileName.lastIndexOf("."));

            String folder = parts[parts.length - 2];

            return folder + "/" + fileName;
        } catch (Exception e) {
            LOGGER.warning("Failed to extract publicId from url: " + url);
            return null;
        }
    }

    @Override
    public void deleteMediaByUrl(String url) {
        String publicId = extractPublicId(url);

        if (url.contains("/video/")) {
            deleteVideoByPublicId(publicId);
        } else {
            deleteImageByPublicId(publicId);
        }
    }

    @Override
    public void deleteByPublicId(String publicId, String resourceType) {
        if (publicId == null)
            return;

        try {
            cloudinary.uploader().destroy(publicId,
                    ObjectUtils.asMap("resource_type", resourceType, "invalidate", true));

            LOGGER.info("Deleted " + resourceType + " with publicId=" + publicId);
        } catch (Exception e) {
            LOGGER.warning("Cloudinary delete failed for " + publicId + ": " + e.getMessage());
        }
    }

    @Override
    public String uploadVideo(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Video file cannot be null or empty");
        }

        try {
            Map<String, Object> uploadParams = new HashMap<>();
            uploadParams.put("resource_type", "video");
            uploadParams.put("folder", folder);

            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            String secureUrl = (String) uploadResult.get("secure_url");
            LOGGER.info("Uploaded video to: " + secureUrl);

            return secureUrl;
        } catch (Exception e) {
            LOGGER.severe("Failed to upload video to Cloudinary: " + e.getMessage());
            throw new IOException("Failed to upload video to Cloudinary: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteVideo(String publicId) throws IOException {
        if (publicId == null || publicId.isEmpty()) {
            return; // Nothing to delete
        }

        try {
            Map<String, Object> deleteParams = new HashMap<>();
            deleteParams.put("resource_type", "video");

            cloudinary.uploader().destroy(publicId, deleteParams);
            LOGGER.info("Deleted video with publicId=" + publicId);
        } catch (Exception e) {
            LOGGER.warning("Failed to delete video from Cloudinary: " + e.getMessage());
            throw new IOException("Failed to delete video from Cloudinary: " + e.getMessage(), e);
        }
    }
}
