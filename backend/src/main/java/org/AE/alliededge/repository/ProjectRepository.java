package org.AE.alliededge.repository;

import org.AE.alliededge.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Project> findByUserId(Long userId);
}
