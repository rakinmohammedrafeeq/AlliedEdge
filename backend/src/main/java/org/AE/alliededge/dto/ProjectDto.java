package org.AE.alliededge.dto;

import org.AE.alliededge.model.Project;

import java.util.List;
import java.util.Map;

/**
 * DTO for the frontend's project editor.
 */
public record ProjectDto(
        Long id,
        String title,
        String summary,
        String status,
        String problem,
        String built,
        String role,
        List<String> techStack,
        Map<String, Object> proofLinks
) {
    public static ProjectDto from(Project p) {
        if (p == null) return null;
        return new ProjectDto(
                p.getId(),
                p.getTitle(),
                p.getSummary(),
                p.getStatus(),
                p.getProblem(),
                p.getBuilt(),
                p.getRole(),
                p.getTechStack(),
                p.getProofLinks()
        );
    }
}
