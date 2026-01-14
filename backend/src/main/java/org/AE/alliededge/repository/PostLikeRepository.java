package org.AE.alliededge.repository;

import org.AE.alliededge.model.Post;
import org.AE.alliededge.model.PostLike;
import org.AE.alliededge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    boolean existsByPostAndUser(Post post, User user);
    long countByPost(Post post);

    @Query("select count(pl) from PostLike pl")
    long countAllLikes();

    void deleteByPostAndUser(Post post, User user);
    void deleteByPost(Post post);
}
