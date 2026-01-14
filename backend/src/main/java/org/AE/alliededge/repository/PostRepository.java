package org.AE.alliededge.repository;

import org.AE.alliededge.model.Post;
import org.AE.alliededge.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByTitleContainingIgnoreCase(String keyword, Pageable pageable);

    // Fetch all posts created by the given user (used for admin stats on profile page)
    List<Post> findByUser(User user);

    // Author dashboard: paginated view of posts by author
    Page<Post> findByUser(User user, Pageable pageable);

    // Convenience: lookup by author id directly
    Page<Post> findByUserId(Long authorId, Pageable pageable);

    long countByUser(User user);

    @Query("SELECT p FROM Post p " +
           "WHERE (:keyword IS NULL OR :keyword = '' " +
           "OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.authorName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Post> searchAllPosts(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT p FROM Post p " +
           "WHERE p.user = :author " +
           "AND (:keyword IS NULL OR :keyword = '' " +
           "OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.authorName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Post> searchPostsByAuthor(@Param("author") User author,
                                   @Param("keyword") String keyword,
                                   Pageable pageable);

    // Variant using author id directly (optional, for simpler service wiring)
    @Query("SELECT p FROM Post p WHERE p.user.id = :authorId AND " +
           "(:keyword IS NULL OR :keyword = '' " +
           "OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Post> searchByAuthorId(@Param("authorId") Long authorId,
                                @Param("keyword") String keyword,
                                Pageable pageable);

    List<Post> findByUserOrderByCreatedAtDesc(User user);
}
