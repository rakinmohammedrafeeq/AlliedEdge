package org.AE.alliededge.repository;

import org.AE.alliededge.model.CommentReply;
import org.AE.alliededge.model.CommentReplyLike;
import org.AE.alliededge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentReplyLikeRepository extends JpaRepository<CommentReplyLike, Long> {
    boolean existsByReplyAndUser(CommentReply reply, User user);

    long countByReply(CommentReply reply);

    void deleteByReplyAndUser(CommentReply reply, User user);

    void deleteByReply(CommentReply reply);
}

