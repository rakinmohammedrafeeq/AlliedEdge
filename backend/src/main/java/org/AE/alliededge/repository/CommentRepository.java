package org.AE.alliededge.repository;

import org.AE.alliededge.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;


public interface CommentRepository extends JpaRepository<Comment, Long> {

    long countByPostId(Long postId);

    /**
     * Batch comment counts for a set of posts.
     * Returns rows: [postId, count].
     */
    @Query("select c.post.id, count(c) from Comment c where c.post.id in :postIds group by c.post.id")
    List<Object[]> countByPostIds(@Param("postIds") Collection<Long> postIds);

    @Query("select count(c) from Comment c")
    long countAllComments();
}
