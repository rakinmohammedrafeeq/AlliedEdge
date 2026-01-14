package org.AE.alliededge.service;


import jakarta.transaction.Transactional;
import org.AE.alliededge.dto.CommentDto;
import org.AE.alliededge.exception.ResourceNotFoundException;
import org.AE.alliededge.model.Comment;
import org.AE.alliededge.model.Post;
import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.CommentLikeRepository;
import org.AE.alliededge.repository.CommentRepository;
import org.AE.alliededge.repository.PostRepository;
import org.AE.alliededge.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentLikeRepository commentLikeRepository;

    public CommentService(CommentRepository commentRepository,
                          PostRepository postRepository,
                          UserRepository userRepository,
                          CommentLikeRepository commentLikeRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.commentLikeRepository = commentLikeRepository;
    }

    public Comment getById(Long id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with ID: " + id));
    }

    @Transactional
    public Comment saveComment(Long postId, String userEmail, CommentDto commentDto) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with ID: " + postId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Comment comment = new Comment();
        comment.setContent(commentDto.getContent());
        comment.setCreatedAt(java.time.LocalDateTime.now());
        comment.setPost(post);
        comment.setUser(user);
        return commentRepository.save(comment);
    }

    @Transactional
    public Long deleteCommentByAdmin(Long commentId) {
        Comment comment = getById(commentId);

        Post post = comment.getPost();
        Long postId = (post != null ? post.getId() : null);

        // Clean up likes explicitly (DB cascade also handles it, but keep consistent with PostService)
        commentLikeRepository.deleteByComment(comment);

        commentRepository.delete(comment);

        return postId;
    }

    // Update existing comment content with security validation
    @Transactional
    public Comment updateComment(Long id, String newContent, String userEmail) {
        Comment c = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        boolean owner = c.getUser() != null && c.getUser().getEmail() != null &&
                c.getUser().getEmail().equalsIgnoreCase(userEmail);
        boolean admin = userRepository.findByEmail(userEmail)
                .map(User::isAdmin)
                .orElse(false);

        if (!owner && !admin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        c.setContent(newContent);
        return commentRepository.save(c);
    }
}
