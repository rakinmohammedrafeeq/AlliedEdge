package org.AE.alliededge.controller;

import org.AE.alliededge.service.UserFollowService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class FollowController {

    private final UserFollowService userFollowService;

    public FollowController(UserFollowService userFollowService) {
        this.userFollowService = userFollowService;
    }

    @PostMapping("/users/{id}/follow")
    public ResponseEntity<String> followUser(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        try {
            String email = authentication.getName();
            userFollowService.followUser(email, id);
            return ResponseEntity.ok("Followed successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/users/{id}/unfollow")
    public ResponseEntity<String> unfollowUser(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        try {
            String email = authentication.getName();
            userFollowService.unfollowUser(email, id);
            return ResponseEntity.ok("Unfollowed successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
