package org.AE.alliededge.repository;

import org.AE.alliededge.model.Post;
import org.AE.alliededge.model.PostView;
import org.AE.alliededge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostViewRepository extends JpaRepository<PostView, Long> {
    boolean existsByPostAndUser(Post post, User user);
    long countByPost(Post post);
    void deleteByPost(Post post);
}
