package org.AE.alliededge.repository;

import org.AE.alliededge.model.CommentReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentReplyRepository extends JpaRepository<CommentReply, Long> {
    List<CommentReply> findByCommentIdOrderByCreatedAtAsc(Long commentId);
}

