package org.AE.alliededge.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.AE.alliededge.model.Comment;
import org.AE.alliededge.service.CommentLikeService;
import org.AE.alliededge.service.CommentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CommentController {

    private final CommentService commentService;
    private final CommentLikeService commentLikeService;

    public CommentController(CommentService commentService, CommentLikeService commentLikeService) {
        this.commentService = commentService;
        this.commentLikeService = commentLikeService;
    }

    public static class UpdateCommentRequest {
        @NotBlank
        public String content;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }

    @PutMapping("/comments/{id}")
    public ResponseEntity<Map<String, Object>> updateComment(@PathVariable Long id,
                                                             @Valid @RequestBody UpdateCommentRequest body,
                                                             Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        Comment updated = commentService.updateComment(id, body.getContent(), principal.getName());
        Long postId = updated.getPost() != null ? updated.getPost().getId() : null;

        Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("comment", updated);
        resp.put("postId", postId);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/comments/{id}/like")
    public ResponseEntity<Map<String, Object>> likeComment(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }

        boolean nowLiked = commentLikeService.toggleLike(id, principal.getName());

        // Fetch updated likes count via service-side denormalized field
        Comment updated = commentService.getById(id);

        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("id", updated.getId());
        body.put("likes", updated.getLikes());
        body.put("liked", nowLiked);
        return ResponseEntity.ok(body);
    }
}
