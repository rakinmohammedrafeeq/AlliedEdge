package org.AE.alliededge.service;

import jakarta.transaction.Transactional;
import org.AE.alliededge.exception.ResourceNotFoundException;
import org.AE.alliededge.model.Comment;
import org.AE.alliededge.model.CommentLike;
import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.CommentLikeRepository;
import org.AE.alliededge.repository.CommentRepository;
import org.AE.alliededge.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CommentLikeService {

    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final UserRepository userRepository;

    public CommentLikeService(CommentRepository commentRepository,
                              CommentLikeRepository commentLikeRepository,
                              UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.commentLikeRepository = commentLikeRepository;
        this.userRepository = userRepository;
    }

    /** Toggle like/unlike on a comment. Returns true if the comment is now liked by the user. */
    @Transactional
    public boolean toggleLike(Long commentId, String userEmail) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + commentId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        // Prevent liking your own comment (keeps UX consistent with post likes)
        if (comment.getUser() != null && comment.getUser().getEmail() != null
                && comment.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot like your own comment.");
        }

        boolean alreadyLiked = commentLikeRepository.existsByCommentAndUser(comment, user);
        if (alreadyLiked) {
            commentLikeRepository.deleteByCommentAndUser(comment, user);
        } else {
            CommentLike like = new CommentLike();
            like.setComment(comment);
            like.setUser(user);
            commentLikeRepository.save(like);
        }

        long count = commentLikeRepository.countByComment(comment);
        comment.setLikes((int) count);
        commentRepository.save(comment);

        return !alreadyLiked;
    }

    public boolean hasUserLiked(Comment comment, String userEmail) {
        if (userEmail == null) return false;
        User user = userRepository.findByEmail(userEmail).orElse(null);
        return user != null && commentLikeRepository.existsByCommentAndUser(comment, user);
    }
}
