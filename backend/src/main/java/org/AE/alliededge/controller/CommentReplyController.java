package org.AE.alliededge.controller;

import jakarta.validation.Valid;
import org.AE.alliededge.dto.CommentDto;
import org.AE.alliededge.model.CommentReply;
import org.AE.alliededge.service.CommentReplyLikeService;
import org.AE.alliededge.service.CommentReplyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CommentReplyController {

    private final CommentReplyService replyService;
    private final CommentReplyLikeService replyLikeService;

    public CommentReplyController(CommentReplyService replyService, CommentReplyLikeService replyLikeService) {
        this.replyService = replyService;
        this.replyLikeService = replyLikeService;
    }

    @PostMapping("/comments/{commentId}/replies")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addReply(@PathVariable Long commentId,
                                      @Valid @RequestBody CommentDto dto,
                                      Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }

        CommentReply saved = replyService.addReply(commentId, principal.getName(), dto);

        org.AE.alliededge.dto.PostDetailDto.CommentReplyViewDto rd =
                new org.AE.alliededge.dto.PostDetailDto.CommentReplyViewDto();
        rd.setId(saved.getId());
        rd.setContent(saved.getContent());
        rd.setCreatedAt(saved.getCreatedAt());
        rd.setLikes(saved.getLikes());
        rd.setLikedByMe(false);

        if (saved.getUser() != null) {
            org.AE.alliededge.dto.PostDetailDto.AuthorDto a = new org.AE.alliededge.dto.PostDetailDto.AuthorDto();
            a.setId(saved.getUser().getId());
            a.setUsername(saved.getUser().getUsername());
            a.setDisplayName(saved.getUser().getDisplayName() != null && !saved.getUser().getDisplayName().isBlank()
                    ? saved.getUser().getDisplayName()
                    : saved.getUser().getUsername());
            a.setProfileImageUrl(saved.getUser().getProfileImageUrl());
            a.setAdmin(saved.getUser().isAdmin());
            rd.setAuthor(a);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("reply", rd, "commentId", commentId));
    }

    @PostMapping("/replies/{replyId}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> likeReply(@PathVariable Long replyId, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }

        boolean nowLiked = replyLikeService.toggleLike(replyId, principal.getName());
        CommentReply updated = replyService.getById(replyId);

        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("id", updated.getId());
        body.put("likes", updated.getLikes());
        body.put("liked", nowLiked);
        return ResponseEntity.ok(body);
    }
}
