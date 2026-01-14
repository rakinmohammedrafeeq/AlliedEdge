package org.AE.alliededge.controller;

import jakarta.validation.Valid;
import org.AE.alliededge.exception.ResourceNotFoundException;
import org.AE.alliededge.model.Post;
import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.UserRepository;
import org.AE.alliededge.service.PostService;
import org.AE.alliededge.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final PostService postService;
    private final UserService userService;
    private final org.AE.alliededge.repository.CommentRepository commentRepository;
    private final org.AE.alliededge.repository.PostLikeRepository postLikeRepository;

    @Autowired
    private UserRepository userRepository;

    public AdminController(PostService postService, UserService userService,
                           org.AE.alliededge.repository.CommentRepository commentRepository,
                           org.AE.alliededge.repository.PostLikeRepository postLikeRepository) {
        this.postService = postService;
        this.userService = userService;
        this.commentRepository = commentRepository;
        this.postLikeRepository = postLikeRepository;
    }

    @GetMapping
    public Map<String, Object> adminDashboard() {
        return Map.of("message", "admin" );
    }

    @GetMapping("/posts")
    public ResponseEntity<Map<String, Object>> showPostListDashboard(@RequestParam(defaultValue = "0") int page,
                                                                     @RequestParam(defaultValue = "10") int size,
                                                                     @RequestParam(value = "keyword", required = false) String keyword,
                                                                     @RequestParam(value = "sortBy", required = false) String sortBy) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage = postService.getAllPosts(keyword, sortBy, pageable);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("postPage", postPage);
        body.put("keyword", keyword);
        body.put("sortBy", (sortBy == null || sortBy.isBlank()) ? "newest" : sortBy);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/posts")
    public ResponseEntity<?> savePost(@Valid @ModelAttribute("post") Post post,
                                      BindingResult bindingResult,
                                      Principal principal) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Validation failed", "errors", bindingResult.getAllErrors()));
        }
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }

        Post saved = postService.savePost(post, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/posts/{id}")
    public Post getPost(@PathVariable Long id) {
        return postService.findPostById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with Id:" + id));
    }

    @DeleteMapping("/posts/{id}")
    public Map<String, Object> deletePost(@PathVariable Long id) {
        postService.deletePostById(id);
        return Map.of("message", "Deleted" );
    }

    // ===== USER MANAGEMENT ENDPOINTS =====

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> listUsers(@RequestParam(required = false) String keyword,
                                                        @RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "10") int size) {
        if (page < 0) page = 0;
        if (size <= 0) size = 10;
        if (size > 100) size = 100;

        Pageable pageable = PageRequest.of(page, size);
        Page<User> usersPage;

        String effectiveKeyword = (keyword == null) ? "" : keyword.trim();
        if (!effectiveKeyword.isEmpty()) {
            usersPage = userRepository.searchUsersPaged(effectiveKeyword, pageable);
        } else {
            usersPage = userRepository.findAllUsersPaged(pageable);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("users", usersPage.getContent());
        body.put("keyword", effectiveKeyword);
        body.put("totalUsers", usersPage.getTotalElements());
        body.put("page", usersPage.getNumber());
        body.put("size", usersPage.getSize());
        body.put("totalPages", usersPage.getTotalPages());
        body.put("first", usersPage.isFirst());
        body.put("last", usersPage.isLast());
        return ResponseEntity.ok(body);
    }

    @GetMapping("/users/{id}/posts")
    public ResponseEntity<Map<String, Object>> viewUserPosts(@PathVariable Long id) {
        User user = userService.getUserById(id);
        if (user == null) {
            throw new ResourceNotFoundException("User not found with ID: " + id);
        }

        List<Post> userPosts = postService.findPostsByUserId(id);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("user", user);
        body.put("posts", userPosts);
        body.put("totalPosts", userPosts.size());
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/posts/{postId}/user-post")
    public Map<String, Object> deleteUserPost(@PathVariable Long postId,
                                              @RequestParam(required = false) Long userId) {
        postService.deletePostById(postId);
        return Map.of("message", "Post deleted successfully", "userId", userId);
    }

    @GetMapping("/post-stats")
    public Map<String, Object> getPostStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByRole("ROLE_AUTHOR");
        long totalComments = commentRepository.countAllComments();
        long totalLikes = postLikeRepository.countAllLikes();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("totalUsers", totalUsers);
        body.put("activeUsers", activeUsers);
        body.put("totalComments", totalComments);
        body.put("totalLikes", totalLikes);
        return body;
    }

    @PostMapping("/users/{id}/ban")
    public ResponseEntity<Map<String, Object>> banUser(@PathVariable Long id) {
        User target = userService.getUserById(id);
        if (target == null) {
            throw new ResourceNotFoundException("User not found with ID: " + id);
        }
        if (target.isAdmin() || "ROLE_ADMIN".equalsIgnoreCase(target.getRole())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Cannot ban an admin user"));
        }
        target.setBanned(true);
        userRepository.save(target);
        return ResponseEntity.ok(Map.of("message", "User banned", "id", target.getId(), "banned", true));
    }

    @PostMapping("/users/{id}/unban")
    public ResponseEntity<Map<String, Object>> unbanUser(@PathVariable Long id) {
        User target = userService.getUserById(id);
        if (target == null) {
            throw new ResourceNotFoundException("User not found with ID: " + id);
        }
        target.setBanned(false);
        userRepository.save(target);
        return ResponseEntity.ok(Map.of("message", "User unbanned", "id", target.getId(), "banned", false));
    }

}
