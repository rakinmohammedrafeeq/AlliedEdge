package org.AE.alliededge.service;

import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
public class ResumeService {

    private final CloudinaryService cloudinaryService;
    private final UserRepository userRepository;

    public ResumeService(CloudinaryService cloudinaryService, UserRepository userRepository) {
        this.cloudinaryService = cloudinaryService;
        this.userRepository = userRepository;
    }

    @Transactional
    public void uploadResume(User user, MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Resume file cannot be empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new IllegalArgumentException("Only PDF files are allowed");
        }

        if (user.getResumePublicId() != null) {
            cloudinaryService.deleteRawFileByPublicId(user.getResumePublicId());
        }

        Map<String, String> result = cloudinaryService.uploadRawFile(file, "resumes");

        user.setResumeUrl(result.get("url"));
        user.setResumePublicId(result.get("publicId"));

        userRepository.save(user);
    }

    @Transactional
    public void deleteResume(User user) {
        if (user.getResumePublicId() != null) {
            cloudinaryService.deleteRawFileByPublicId(user.getResumePublicId());
        }

        user.setResumeUrl(null);
        user.setResumePublicId(null);

        userRepository.save(user);
    }
}
