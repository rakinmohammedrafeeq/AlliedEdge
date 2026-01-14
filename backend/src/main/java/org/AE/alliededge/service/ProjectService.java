package org.AE.alliededge.service;

import org.AE.alliededge.model.Project;
import org.AE.alliededge.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    public List<Project> getProjectsByUser(Long userId) {
        return projectRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Project saveProject(Project project) {
        return projectRepository.save(project);
    }

    public Optional<Project> findById(Long id) {
        return projectRepository.findById(id);
    }

    public void deleteProject(Long projectId) {
        projectRepository.deleteById(projectId);
    }

    public boolean existsById(Long id) {
        return projectRepository.existsById(id);
    }
}
