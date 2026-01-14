package org.AE.alliededge.repository;

import org.AE.alliededge.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByVisibleTrueOrderByCreatedAtDesc();

    List<Announcement> findAllByOrderByCreatedAtDesc();

    Optional<Announcement> findByIsWelcomeAnnouncementTrue();
}
