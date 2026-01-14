package org.AE.alliededge.service;

import org.AE.alliededge.dto.PostStatsDto;
import org.AE.alliededge.model.Post;
import org.AE.alliededge.repository.CommentRepository;
import org.AE.alliededge.repository.PostRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class PostRealtimePublisher {
    private static final Logger log = LoggerFactory.getLogger(PostRealtimePublisher.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    public PostRealtimePublisher(SimpMessagingTemplate messagingTemplate,
                                 PostRepository postRepository,
                                 CommentRepository commentRepository) {
        this.messagingTemplate = messagingTemplate;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
    }

    /**
     * Publish the latest post counters to /topic/posts/{postId}.
     * Safe to call even if websocket is unused.
     */
    public void publishPostStats(Long postId) {
        try {
            Post post = postRepository.findById(postId).orElse(null);
            if (post == null) return;

            int likes = post.getLikes();
            int commentCount = (int) commentRepository.countByPostId(postId);

            PostStatsDto dto = new PostStatsDto(postId, likes, commentCount, Instant.now());
            messagingTemplate.convertAndSend("/topic/posts/" + postId, dto);
        } catch (Exception e) {
            // Never break the request because realtime publish failed.
            log.warn("Failed to publish post stats for postId={}", postId, e);
        }
    }
}

