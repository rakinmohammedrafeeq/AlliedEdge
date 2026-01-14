package org.AE.alliededge.controller;

import jakarta.validation.Valid;
import org.AE.alliededge.model.Post;
import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.PostRepository;
import org.AE.alliededge.service.PostService;
import org.AE.alliededge.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasAnyRole('AUTHOR','ADMIN')")
public class AuthorPostController {

    private final PostRepository postRepository;
    private final UserService userService;
    private final PostService postService;

    public AuthorPostController(PostRepository postRepository, UserService userService, PostService postService) {
        this.postRepository = postRepository;
        this.userService = userService;
        this.postService = postService;
    }

    @GetMapping("/author/posts")
    public Page<Post> listAuthorPosts(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "10") int size,
                                      @RequestParam(value = "keyword", required = false) String keyword,
                                      @RequestParam(value = "sortBy", required = false) String sortBy) {
        User current = userService.getCurrentUserOrThrow();
        Pageable pageable = PageRequest.of(page, size);
        return postService.getAuthorPosts(current.getId(), keyword, sortBy, pageable);
    }

    @PostMapping("/author/posts")
    public Map<String, Object> createPost(@Valid @ModelAttribute("post") Post post,
                                          BindingResult bindingResult,
                                          @RequestParam(name = "images", required = false) java.util.List<MultipartFile> images,
                                          @RequestParam(name = "video", required = false) MultipartFile video) {
        User current = userService.getCurrentUserOrThrow();
        if (!current.isAuthor() && !current.isAdmin()) {
            throw new AccessDeniedException("Only authors can create posts");
        }

        if (bindingResult.hasErrors()) {
            return Map.of("message", "Validation failed", "errors", bindingResult.getAllErrors());
        }

        post.setId(null);
        post.setUser(current);
        Post saved = postService.savePost(post, current.getEmail());
        return Map.of("message", "Created", "post", saved);
    }

    @GetMapping("/author/posts/{id}")
    public Post getPost(@PathVariable Long id) {
        User current = userService.getCurrentUserOrThrow();
        Post post = postRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        enforceOwnership(current, post);
        return post;
    }

    @PutMapping("/author/posts/{id}")
    public Map<String, Object> updatePost(@PathVariable Long id,
                                          @Valid @ModelAttribute("post") Post updated,
                                          BindingResult bindingResult,
                                          @RequestParam(name = "images", required = false) java.util.List<MultipartFile> images,
                                          @RequestParam(name = "video", required = false) MultipartFile video) {
        User current = userService.getCurrentUserOrThrow();
        Post existing = postRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        enforceOwnership(current, existing);

        if (bindingResult.hasErrors()) {
            return Map.of("message", "Validation failed", "errors", bindingResult.getAllErrors());
        }

        existing.setTitle(updated.getTitle());
        existing.setContent(updated.getContent());

        Post saved = postRepository.save(existing);
        return Map.of("message", "Updated", "post", saved);
    }

    @DeleteMapping("/author/posts/{id}")
    public Map<String, Object> deletePost(@PathVariable Long id) {
        User current = userService.getCurrentUserOrThrow();
        Post post = postRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        enforceOwnership(current, post);
        postRepository.delete(post);
        return Map.of("message", "Deleted");
    }

    private void enforceOwnership(User current, Post post) {
        if (current.isAdmin()) {
            return;
        }
        if (!post.getUser().getId().equals(current.getId())) {
            throw new AccessDeniedException("You do not own this post");
        }
    }
}
