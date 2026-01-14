package org.AE.alliededge.repository;

import org.AE.alliededge.model.Comment;
import org.AE.alliededge.model.CommentLike;
import org.AE.alliededge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {
    boolean existsByCommentAndUser(Comment comment, User user);
    long countByComment(Comment comment);
    void deleteByCommentAndUser(Comment comment, User user);
    void deleteByComment(Comment comment);
}

