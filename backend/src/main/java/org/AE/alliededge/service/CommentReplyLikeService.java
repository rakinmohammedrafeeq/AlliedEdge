package org.AE.alliededge.service;

import jakarta.transaction.Transactional;
import org.AE.alliededge.exception.ResourceNotFoundException;
import org.AE.alliededge.model.CommentReply;
import org.AE.alliededge.model.CommentReplyLike;
import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.CommentReplyLikeRepository;
import org.AE.alliededge.repository.CommentReplyRepository;
import org.AE.alliededge.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CommentReplyLikeService {

    private final CommentReplyRepository replyRepository;
    private final CommentReplyLikeRepository replyLikeRepository;
    private final UserRepository userRepository;

    public CommentReplyLikeService(CommentReplyRepository replyRepository,
                                  CommentReplyLikeRepository replyLikeRepository,
                                  UserRepository userRepository) {
        this.replyRepository = replyRepository;
        this.replyLikeRepository = replyLikeRepository;
        this.userRepository = userRepository;
    }

    /** Toggle like/unlike on a reply. Returns true if the reply is now liked by the user. */
    @Transactional
    public boolean toggleLike(Long replyId, String userEmail) {
        CommentReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new ResourceNotFoundException("Reply not found: " + replyId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        // Prevent liking your own reply
        if (reply.getUser() != null && reply.getUser().getEmail() != null
                && reply.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot like your own reply.");
        }

        boolean alreadyLiked = replyLikeRepository.existsByReplyAndUser(reply, user);
        if (alreadyLiked) {
            replyLikeRepository.deleteByReplyAndUser(reply, user);
        } else {
            CommentReplyLike like = new CommentReplyLike();
            like.setReply(reply);
            like.setUser(user);
            replyLikeRepository.save(like);
        }

        long count = replyLikeRepository.countByReply(reply);
        reply.setLikes((int) count);
        replyRepository.save(reply);

        return !alreadyLiked;
    }

    public boolean hasUserLiked(CommentReply reply, String userEmail) {
        if (userEmail == null) return false;
        User user = userRepository.findByEmail(userEmail).orElse(null);
        return user != null && replyLikeRepository.existsByReplyAndUser(reply, user);
    }
}

