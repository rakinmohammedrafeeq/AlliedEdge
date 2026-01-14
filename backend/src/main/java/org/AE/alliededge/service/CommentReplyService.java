package org.AE.alliededge.service;

import jakarta.transaction.Transactional;
import org.AE.alliededge.dto.CommentDto;
import org.AE.alliededge.exception.ResourceNotFoundException;
import org.AE.alliededge.model.Comment;
import org.AE.alliededge.model.CommentReply;
import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.CommentReplyRepository;
import org.AE.alliededge.repository.CommentRepository;
import org.AE.alliededge.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class CommentReplyService {

    private final CommentReplyRepository replyRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    public CommentReplyService(CommentReplyRepository replyRepository,
                              CommentRepository commentRepository,
                              UserRepository userRepository) {
        this.replyRepository = replyRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    public CommentReply getById(Long id) {
        return replyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reply not found with ID: " + id));
    }

    @Transactional
    public CommentReply addReply(Long commentId, String userEmail, CommentDto dto) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with ID: " + commentId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        CommentReply reply = new CommentReply();
        reply.setComment(comment);
        reply.setUser(user);
        reply.setContent(dto.getContent());
        reply.setCreatedAt(java.time.LocalDateTime.now());
        return replyRepository.save(reply);
    }
}
