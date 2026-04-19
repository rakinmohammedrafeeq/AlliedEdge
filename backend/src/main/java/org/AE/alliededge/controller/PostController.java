package org.AE.alliededge.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.AE.alliededge.dto.CommentDto;
import org.AE.alliededge.dto.PostDetailDto;
import org.AE.alliededge.dto.PostFeedItemDto;
import org.AE.alliededge.dto.PostPageDto;
import org.AE.alliededge.exception.ResourceNotFoundException;
import org.AE.alliededge.model.Announcement;
import org.AE.alliededge.model.Comment;
import org.AE.alliededge.model.Post;
import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.UserRepository;
import org.AE.alliededge.service.AnnouncementService;
import org.AE.alliededge.service.CommentService;
import org.AE.alliededge.service.PostService;
import org.AE.alliededge.service.UserService;
import org.AE.alliededge.service.CloudinaryService;
import org.AE.alliededge.service.CommentLikeService;
import org.AE.alliededge.service.CommentReplyLikeService;
import org.AE.alliededge.service.PostRealtimePublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.security.Principal;
import java.util.*;
import org.springframework.data.domain.PageRequest;
import org.AE.alliededge.repository.CommentRepository;

// Handles all post-related operations including feed retrieval,
// post creation, updates, likes, comments, and real-time updates
@RestController
@RequestMapping("/api")
public class PostController {

    private final PostService postService;
    private final CommentService commentService;
    private final UserService userService;
    private final CloudinaryService cloudinaryService;
    private final AnnouncementService announcementService;
    private final UserRepository userRepository;
    private final CommentLikeService commentLikeService;
    private final CommentReplyLikeService commentReplyLikeService;
    private final CommentRepository commentRepository;
    private final PostRealtimePublisher postRealtimePublisher;

    // Admin emails that are not allowed to like posts
    private static final Set<String> ADMIN_LIKE_BLOCKED_EMAILS = Set.of(
            "rayanmohammedrafeeq@gmail.com",
            "rakinmohammedrafeeq@gmail.com");

    public PostController(PostService postService, CommentService commentService, UserService userService,
                          CloudinaryService cloudinaryService, AnnouncementService announcementService,
                          UserRepository userRepository, CommentLikeService commentLikeService,
                          CommentReplyLikeService commentReplyLikeService,
                          CommentRepository commentRepository,
                          PostRealtimePublisher postRealtimePublisher) {
        this.postService = postService;
        this.commentService = commentService;
        this.userService = userService;
        this.cloudinaryService = cloudinaryService;
        this.announcementService = announcementService;
        this.userRepository = userRepository;
        this.commentLikeService = commentLikeService;
        this.commentReplyLikeService = commentReplyLikeService;
        this.commentRepository = commentRepository;
        this.postRealtimePublisher = postRealtimePublisher;
    }

    // 🏠 Home Page / Feed
    // Fetches paginated posts feed with sorting, search, and user-specific metadata
    @GetMapping("/posts")
    public ResponseEntity<Map<String, Object>> getPosts(
            @PageableDefault(size = 5, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "sortBy", required = false, defaultValue = "newest") String sortBy,
            Principal principal,
            HttpServletRequest request) {

        // Determine sort strategy
        Sort sort;
        switch (sortBy) {
            case "oldest" -> sort = Sort.by(Sort.Direction.ASC, "createdAt");
            case "mostLiked" -> sort = Sort.by(Sort.Direction.DESC, "likes");
            case "mostViewed" -> sort = Sort.by(Sort.Direction.DESC, "views");
            case "newest" -> sort = Sort.by(Sort.Direction.DESC, "createdAt");
            default -> {
                sort = Sort.by(Sort.Direction.DESC, "createdAt");
                sortBy = "newest";
            }
        }

        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        // Normalize keyword and use the unified search query (title/content/author).
        String kw = (keyword == null) ? null : keyword.trim();
        Page<Post> postPage = postService.getAllPosts(kw, sortBy, sortedPageable);

        // Pre-compute comment counts for this page (avoid LAZY collection pitfalls)
        Map<Long, Integer> commentCountsByPostId = new HashMap<>();
        List<Long> postIds = postPage.getContent().stream()
                .map(Post::getId)
                .filter(Objects::nonNull)
                .toList();
        if (!postIds.isEmpty()) {
            for (Object[] row : commentRepository.countByPostIds(postIds)) {
                if (row == null || row.length < 2) continue;
                Long postId = row[0] != null ? ((Number) row[0]).longValue() : null;
                Integer cnt = row[1] != null ? ((Number) row[1]).intValue() : 0;
                if (postId != null) commentCountsByPostId.put(postId, cnt);
            }
        }

        // Map entities -> stable DTOs (prevents entity graph recursion)
        List<PostFeedItemDto> postDtos = postPage.getContent().stream().map(p -> {
            PostFeedItemDto dto = new PostFeedItemDto();
            dto.setId(p.getId());
            dto.setTitle(p.getTitle());
            dto.setContent(makeLinksClickable(p.getContent()));
            dto.setCreatedAt(p.getCreatedAt());
            dto.setLikes(p.getLikes());
            dto.setViews(p.getViews());
            dto.setCommentCount(commentCountsByPostId.getOrDefault(p.getId(), 0));
            dto.setAuthorName(p.getAuthorName());
            dto.setAuthorIsAdmin(p.isAuthorIsAdmin());
            // Persist liked state for feeds:
            if (principal != null) {
                dto.setLikedByMe(postService.hasUserLiked(p, principal.getName()));
            } else {
                dto.setLikedByMe(null);
            }

            // Include media URLs so the UI can render images/videos on the feed.
            dto.setImageUrls(p.getImageUrls());
            dto.setVideoUrl(p.getVideoUrl());

            User u = p.getUser();
            if (u != null) {
                dto.setAuthorId(u.getId());
                dto.setAuthorUsername(u.getUsername());
                dto.setAuthorEmail(u.getEmail());
                // Prefer display name if present, fall back to username
                dto.setAuthorDisplayName(u.getDisplayName() != null && !u.getDisplayName().isBlank()
                        ? u.getDisplayName()
                        : u.getUsername());
                dto.setAuthorProfileImageUrl(u.getProfileImageUrl());
                // If author_name was not populated on legacy data, fill with best effort.
                if (dto.getAuthorName() == null || dto.getAuthorName().isBlank()) {
                    dto.setAuthorName(dto.getAuthorDisplayName());
                }
            }

            return dto;
        }).toList();

        PostPageDto safePage = new PostPageDto();
        safePage.setContent(postDtos);
        safePage.setPageNumber(postPage.getNumber());
        safePage.setPageSize(postPage.getSize());
        safePage.setTotalElements(postPage.getTotalElements());
        safePage.setTotalPages(postPage.getTotalPages());
        safePage.setFirst(postPage.isFirst());
        safePage.setLast(postPage.isLast());

        // latest announcements (kept from original home logic)
        List<Announcement> latestAnnouncements = announcementService.findAllVisible()
                .stream()
                .limit(2)
                .toList();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("postPage", safePage);
        body.put("sortBy", sortBy);
        body.put("keyword", keyword);
        body.put("latestAnnouncements", latestAnnouncements);

        if (principal != null) {
            String userEmail = principal.getName();
            body.put("currentUserEmail", userEmail);

            // first login + welcome announcement
            boolean firstLogin = false;
            Announcement welcomeAnnouncement = null;
            Optional<User> optUser = userRepository.findByEmail(userEmail);
            if (optUser.isPresent()) {
                User user = optUser.get();
                if (user.isFirstLogin()) {
                    firstLogin = true;
                    welcomeAnnouncement = announcementService.getWelcomeAnnouncement().orElse(null);
                    user.setFirstLogin(false);
                    userRepository.save(user);
                }
            }
            body.put("firstLogin", firstLogin);
            body.put("welcomeAnnouncement", welcomeAnnouncement);

            Set<Long> likedPostIds = new HashSet<>();
            for (Post p : postPage.getContent()) {
                if (postService.hasUserLiked(p, userEmail)) {
                    likedPostIds.add(p.getId());
                }
            }
            body.put("likedPostIds", likedPostIds);

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = auth != null && auth.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .anyMatch("ROLE_ADMIN"::equals);
            body.put("isAdmin", isAdmin);
            body.put("isAuthenticated", true);
            body.put("isAdminEmailLikeBlocked", ADMIN_LIKE_BLOCKED_EMAILS.contains(userEmail));
        } else {
            body.put("isAdmin", false);
            body.put("isAuthenticated", false);
            body.put("isAdminEmailLikeBlocked", false);
            body.put("firstLogin", false);
            body.put("welcomeAnnouncement", null);
        }

        body.put("baseUrl", getBaseUrl(request));
        return ResponseEntity.ok(body);
    }

    // 📄 Post Detail
    @GetMapping("/posts/{id}")
    public ResponseEntity<Map<String, Object>> getPost(@PathVariable Long id,
                                                       @RequestParam(value = "sortComments", required = false, defaultValue = "newest") String sortComments,
                                                       Principal principal,
                                                       HttpServletRequest request) {
        Post post = postService.findPostById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with Id: " + id));

        String userEmail = null;
        if (principal != null) {
            userEmail = principal.getName();
            post = postService.recordView(id, userEmail);
        }

        post.setContent(makeLinksClickable(post.getContent()));

        boolean liked = principal != null && postService.hasUserLiked(post, userEmail);
        boolean isAuthenticated = principal != null;
        boolean isAdminEmailLikeBlocked = isAuthenticated && ADMIN_LIKE_BLOCKED_EMAILS.contains(userEmail);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);

        // Build stable DTO (avoid exposing entities directly)
        PostDetailDto dto = new PostDetailDto();
        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setContent(post.getContent());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setLikes(post.getLikes());
        dto.setViews(post.getViews());
        dto.setImageUrls(post.getImageUrls());
        dto.setVideoUrl(post.getVideoUrl());

        if (post.getUser() != null) {
            PostDetailDto.AuthorDto author = new PostDetailDto.AuthorDto();
            author.setId(post.getUser().getId());
            author.setUsername(post.getUser().getUsername());
            author.setDisplayName(
                    post.getUser().getDisplayName() != null && !post.getUser().getDisplayName().isBlank()
                            ? post.getUser().getDisplayName()
                            : post.getUser().getUsername()
            );
            author.setProfileImageUrl(post.getUser().getProfileImageUrl());
            author.setAdmin(post.getUser().isAdmin());
            dto.setAuthor(author);
        }

        List<PostDetailDto.CommentViewDto> commentDtos = new ArrayList<>();
        List<Comment> comments = post.getComments() != null ? new ArrayList<>(post.getComments()) : new ArrayList<>();

        // Sort comments
        switch (sortComments == null ? "newest" : sortComments) {
            case "oldest" -> comments.sort(Comparator.comparing(Comment::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
            case "mostReplied" -> comments.sort((a, b) -> Integer.compare(
                    b.getReplies() != null ? b.getReplies().size() : 0,
                    a.getReplies() != null ? a.getReplies().size() : 0
            ));
            case "newest" -> comments.sort(Comparator.comparing(Comment::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
            default -> comments.sort(Comparator.comparing(Comment::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        }

        for (Comment c : comments) {
            PostDetailDto.CommentViewDto cd = new PostDetailDto.CommentViewDto();
            cd.setId(c.getId());
            cd.setContent(c.getContent());
            cd.setCreatedAt(c.getCreatedAt());
            cd.setLikes(c.getLikes());
            cd.setLikedByMe(principal != null && commentLikeService.hasUserLiked(c, userEmail));

            if (c.getUser() != null) {
                PostDetailDto.AuthorDto ca = new PostDetailDto.AuthorDto();
                ca.setId(c.getUser().getId());
                ca.setUsername(c.getUser().getUsername());
                ca.setDisplayName(
                        c.getUser().getDisplayName() != null && !c.getUser().getDisplayName().isBlank()
                                ? c.getUser().getDisplayName()
                                : c.getUser().getUsername()
                );
                ca.setProfileImageUrl(c.getUser().getProfileImageUrl());
                ca.setAdmin(c.getUser().isAdmin());
                cd.setAuthor(ca);
            }

            List<PostDetailDto.CommentReplyViewDto> replyDtos = new ArrayList<>();
            if (c.getReplies() != null) {
                List<org.AE.alliededge.model.CommentReply> replies = new ArrayList<>(c.getReplies());
                replies.sort(Comparator.comparing(org.AE.alliededge.model.CommentReply::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())));

                for (org.AE.alliededge.model.CommentReply r : replies) {
                    PostDetailDto.CommentReplyViewDto rd = new PostDetailDto.CommentReplyViewDto();
                    rd.setId(r.getId());
                    rd.setContent(r.getContent());
                    rd.setCreatedAt(r.getCreatedAt());
                    rd.setLikes(r.getLikes());
                    rd.setLikedByMe(principal != null && commentReplyLikeService.hasUserLiked(r, userEmail));

                    if (r.getUser() != null) {
                        PostDetailDto.AuthorDto ra = new PostDetailDto.AuthorDto();
                        ra.setId(r.getUser().getId());
                        ra.setUsername(r.getUser().getUsername());
                        ra.setDisplayName(
                                r.getUser().getDisplayName() != null && !r.getUser().getDisplayName().isBlank()
                                        ? r.getUser().getDisplayName()
                                        : r.getUser().getUsername()
                        );
                        ra.setProfileImageUrl(r.getUser().getProfileImageUrl());
                        ra.setAdmin(r.getUser().isAdmin());
                        rd.setAuthor(ra);
                    }
                    replyDtos.add(rd);
                }
            }
            cd.setReplies(replyDtos);

            commentDtos.add(cd);
        }
        dto.setComments(commentDtos);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("post", dto);
        body.put("liked", liked);
        body.put("isAuthenticated", isAuthenticated);
        body.put("isAdminEmailLikeBlocked", isAdminEmailLikeBlocked);
        body.put("isAdmin", isAdmin);
        body.put("baseUrl", getBaseUrl(request));
        body.put("sortComments", sortComments);

        return ResponseEntity.ok(body);
    }

    // 💬 Add Comment
    @PostMapping("/posts/{postId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> submitComment(@PathVariable Long postId,
                                          @Valid @RequestBody CommentDto commentDto,
                                          Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }
        String userEmail = principal.getName();
        Comment saved = commentService.saveComment(postId, userEmail, commentDto);

        // Realtime: notify all subscribers that this post's counts changed.
        // Publishes real-time updates (likes/comments) to subscribed clients via WebSockets
        postRealtimePublisher.publishPostStats(postId);

        PostDetailDto.CommentViewDto cd = new PostDetailDto.CommentViewDto();
        cd.setId(saved.getId());
        cd.setContent(saved.getContent());
        cd.setCreatedAt(saved.getCreatedAt());
        if (saved.getUser() != null) {
            PostDetailDto.AuthorDto ca = new PostDetailDto.AuthorDto();
            ca.setId(saved.getUser().getId());
            ca.setUsername(saved.getUser().getUsername());
            ca.setDisplayName(
                    saved.getUser().getDisplayName() != null && !saved.getUser().getDisplayName().isBlank()
                            ? saved.getUser().getDisplayName()
                            : saved.getUser().getUsername()
            );
            ca.setProfileImageUrl(saved.getUser().getProfileImageUrl());
            ca.setAdmin(saved.getUser().isAdmin());
            cd.setAuthor(ca);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("comment", cd, "postId", postId));
    }

    // 🟢 Create Post (Admin media upload endpoint)
    // NOTE: AdminController owns POST /api/admin/posts (metadata-only create).
    // This endpoint is specifically for multipart media uploads.
    @PostMapping("/admin/posts/media")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Post> createPostAsAdmin(@ModelAttribute Post post,
                                                  @RequestParam(value = "imageFiles", required = false) List<MultipartFile> imageFiles,
                                                  @RequestParam(value = "videoFile", required = false) MultipartFile videoFile,
                                                  Principal principal) throws IOException {

        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        if (post.getImageUrls() == null) {
            post.setImageUrls(new ArrayList<>());
        }

        if (imageFiles != null && !imageFiles.isEmpty()) {
            for (MultipartFile imageFile : imageFiles) {
                if (imageFile == null || imageFile.isEmpty()) {
                    continue;
                }
                if (imageFile.getSize() > 20L * 1024 * 1024) {
                    throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                            "Image file is too large. Max 20MB per image.");
                }
                String contentType = imageFile.getContentType();
                if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Only image files are allowed for images");
                }
                String imageUrl = cloudinaryService.uploadMedia(imageFile);
                post.getImageUrls().add(imageUrl);
            }
        }

        if (videoFile != null && !videoFile.isEmpty()) {
            if (videoFile.getSize() > 100L * 1024 * 1024) {
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                        "Video file is too large. Max 100MB.");
            }
            String videoUrl = cloudinaryService.uploadVideo(videoFile, "posts/videos");
            post.setVideoUrl(videoUrl);
        }

        String userEmail = principal.getName();
        Post saved = postService.savePost(post, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // 🟡 Update Post (Admin endpoint kept, now JSON)
    @PutMapping("/admin/posts/{id}/media")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Post> updatePostAsAdmin(@PathVariable Long id,
                                                  @ModelAttribute Post post,
                                                  @RequestParam(value = "imageFiles", required = false) List<MultipartFile> imageFiles,
                                                  @RequestParam(value = "videoFile", required = false) MultipartFile videoFile,
                                                  @RequestParam(value = "deleteImageId", required = false) List<Long> deleteImageIds,
                                                  @RequestParam(value = "deleteVideo", required = false) Boolean deleteVideo,
                                                  Principal principal) throws IOException {

        post.setId(id);

        Post existing = postService.findPostById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with Id: " + id));

        assertCanModifyPost(existing, principal);

        List<String> currentImages = existing.getImageUrls() != null
                ? new ArrayList<>(existing.getImageUrls())
                : new ArrayList<>();

        if (deleteImageIds != null && !deleteImageIds.isEmpty()) {
            deleteImageIds.stream()
                    .sorted((a, b) -> Long.compare(b, a))
                    .forEach(idxLong -> {
                        int idx = idxLong.intValue();
                        if (idx >= 0 && idx < currentImages.size()) {
                            String urlToDelete = currentImages.get(idx);
                            cloudinaryService.deleteMediaByUrl(urlToDelete);
                            currentImages.remove(idx);
                        }
                    });
        }

        post.setImageUrls(currentImages);

        if (imageFiles != null && !imageFiles.isEmpty()) {
            for (MultipartFile imageFile : imageFiles) {
                if (imageFile == null || imageFile.isEmpty()) {
                    continue;
                }
                if (imageFile.getSize() > 20L * 1024 * 1024) {
                    throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                            "Image file is too large. Max 20MB per image.");
                }
                String contentType = imageFile.getContentType();
                if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Only image files are allowed for images");
                }
                String imageUrl = cloudinaryService.uploadMedia(imageFile);
                post.getImageUrls().add(imageUrl);
            }
        }

        String effectiveVideoUrl = existing.getVideoUrl();
        String effectiveVideoPublicId = existing.getVideoPublicId();

        if (Boolean.TRUE.equals(deleteVideo) && effectiveVideoUrl != null) {
            if (effectiveVideoPublicId != null && !effectiveVideoPublicId.isBlank()) {
                cloudinaryService.deleteVideoByPublicId(effectiveVideoPublicId);
            } else {
                cloudinaryService.deleteMediaByUrl(effectiveVideoUrl);
            }
            effectiveVideoUrl = null;
            effectiveVideoPublicId = null;
        }

        if (videoFile != null && !videoFile.isEmpty()) {
            if (videoFile.getSize() > 100L * 1024 * 1024) {
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                        "Video file is too large. Max 100MB.");
            }
            if (effectiveVideoUrl != null && !Boolean.TRUE.equals(deleteVideo)) {
                if (effectiveVideoPublicId != null && !effectiveVideoPublicId.isBlank()) {
                    cloudinaryService.deleteVideoByPublicId(effectiveVideoPublicId);
                } else {
                    cloudinaryService.deleteMediaByUrl(effectiveVideoUrl);
                }
            }

            String videoUrl = cloudinaryService.uploadVideo(videoFile, "posts/videos");
            post.setVideoUrl(videoUrl);
        } else {
            post.setVideoUrl(effectiveVideoUrl);
            post.setVideoPublicId(effectiveVideoPublicId);
        }

        String userEmail = principal.getName();
        Post saved = postService.savePost(post, userEmail);
        return ResponseEntity.ok(saved);
    }

    // 🟢 Create Post (authenticated user)
    @PostMapping("/posts")
    @PreAuthorize("hasAnyAuthority('ROLE_USER','ROLE_AUTHOR','ROLE_ADMIN')")
    public ResponseEntity<Post> createAuthorPost(@Valid @ModelAttribute Post post,
                                                 @RequestParam(value = "imageFiles", required = false) List<MultipartFile> imageFiles,
                                                 @RequestParam(value = "videoFile", required = false) MultipartFile videoFile,
                                                 Principal principal) throws IOException {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (post.getImageUrls() == null) {
            post.setImageUrls(new ArrayList<>());
        }
        if (imageFiles != null && !imageFiles.isEmpty()) {
            for (MultipartFile imageFile : imageFiles) {
                if (imageFile == null || imageFile.isEmpty()) continue;
                if (imageFile.getSize() > 20L * 1024 * 1024) {
                    throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                            "Image file is too large. Max 20MB per image.");
                }
                String contentType = imageFile.getContentType();
                if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Only image files are allowed for images");
                }
                String imageUrl = cloudinaryService.uploadMedia(imageFile);
                post.getImageUrls().add(imageUrl);
            }
        }
        if (videoFile != null && !videoFile.isEmpty()) {
            if (videoFile.getSize() > 100L * 1024 * 1024) {
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                        "Video file is too large. Max 100MB.");
            }
            String videoUrl = cloudinaryService.uploadVideo(videoFile, "posts/videos");
            post.setVideoUrl(videoUrl);
        }
        String userEmail = principal.getName();
        Post saved = postService.savePost(post, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ✏️ Update Post (owner/admin)
    // The SPA calls PUT /api/posts/{id}. Keep /posts/{id} for backwards compatibility.
    @PutMapping("/posts/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_USER','ROLE_AUTHOR','ROLE_ADMIN')")
    public ResponseEntity<Post> updatePost(@PathVariable Long id,
                                           @Valid @ModelAttribute Post post,
                                           @RequestParam(value = "imageFiles", required = false) List<MultipartFile> imageFiles,
                                           @RequestParam(value = "videoFile", required = false) MultipartFile videoFile,
                                           @RequestParam(value = "deleteImageId", required = false) List<Long> deleteImageIds,
                                           @RequestParam(value = "deleteVideo", required = false) Boolean deleteVideo,
                                           Principal principal) throws IOException {
        post.setId(id);
        post.setDeleteVideo(Boolean.TRUE.equals(deleteVideo));

        Post existing = postService.findPostById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with Id: " + id));

        // Enforce owner/admin (inside method) rather than role-gating the endpoint.
        assertCanModifyPost(existing, principal);

        // Start from existing media, then apply deletions/uploads.
        List<String> currentImages = existing.getImageUrls() != null
                ? new ArrayList<>(existing.getImageUrls())
                : new ArrayList<>();

        if (deleteImageIds != null && !deleteImageIds.isEmpty()) {
            deleteImageIds.stream()
                    .sorted((a, b) -> Long.compare(b, a))
                    .forEach(idxLong -> {
                        int idx = idxLong.intValue();
                        if (idx >= 0 && idx < currentImages.size()) {
                            String urlToDelete = currentImages.get(idx);
                            cloudinaryService.deleteMediaByUrl(urlToDelete);
                            currentImages.remove(idx);
                        }
                    });
        }

        post.setImageUrls(currentImages);

        if (imageFiles != null && !imageFiles.isEmpty()) {
            for (MultipartFile imageFile : imageFiles) {
                if (imageFile == null || imageFile.isEmpty()) continue;
                if (imageFile.getSize() > 20L * 1024 * 1024) {
                    throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                            "Image file is too large. Max 20MB per image.");
                }
                String contentType = imageFile.getContentType();
                if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Only image files are allowed for images");
                }
                String imageUrl = cloudinaryService.uploadMedia(imageFile);
                post.getImageUrls().add(imageUrl);
            }
        }

        String effectiveVideoUrl = existing.getVideoUrl();
        String effectiveVideoPublicId = existing.getVideoPublicId();

        if (Boolean.TRUE.equals(deleteVideo) && effectiveVideoUrl != null) {
            if (effectiveVideoPublicId != null && !effectiveVideoPublicId.isBlank()) {
                cloudinaryService.deleteVideoByPublicId(effectiveVideoPublicId);
            } else {
                cloudinaryService.deleteMediaByUrl(effectiveVideoUrl);
            }
            effectiveVideoUrl = null;
            effectiveVideoPublicId = null;
        }

        if (videoFile != null && !videoFile.isEmpty()) {
            if (videoFile.getSize() > 100L * 1024 * 1024) {
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                        "Video file is too large. Max 100MB.");
            }
            if (effectiveVideoUrl != null && !Boolean.TRUE.equals(deleteVideo)) {
                if (effectiveVideoPublicId != null && !effectiveVideoPublicId.isBlank()) {
                    cloudinaryService.deleteVideoByPublicId(effectiveVideoPublicId);
                } else {
                    cloudinaryService.deleteMediaByUrl(effectiveVideoUrl);
                }
            }
            String videoUrl = cloudinaryService.uploadVideo(videoFile, "posts/videos");
            post.setVideoUrl(videoUrl);
        } else {
            post.setVideoUrl(effectiveVideoUrl);
            post.setVideoPublicId(effectiveVideoPublicId);
        }

        String userEmail = principal.getName();
        Post saved = postService.savePost(post, userEmail);
        return ResponseEntity.ok(saved);
    }

    // 👍 Like Post
    @PostMapping("/posts/{id}/like")
    public ResponseEntity<Map<String, Object>> likePost(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }
        String userEmail = principal.getName();
        boolean nowLiked = postService.toggleLike(id, userEmail);

        Post updated = postService.findPostById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with Id: " + id));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("liked", nowLiked);
        body.put("likes", updated.getLikes());
        body.put("id", updated.getId());

        // Realtime: notify all subscribers that this post's counts changed.
        postRealtimePublisher.publishPostStats(id);

        return ResponseEntity.ok(body);
    }

    // 📜 My Posts (Author/Admin)
    @GetMapping("/posts/mine")
    @PreAuthorize("hasAnyAuthority('ROLE_AUTHOR','ROLE_ADMIN')")
    public ResponseEntity<Page<Post>> getMyPosts(Principal principal,
                                                 @RequestParam(value = "keyword", required = false) String keyword,
                                                 @RequestParam(value = "sortBy", required = false, defaultValue = "newest") String sortBy,
                                                 @PageableDefault(size = 10) Pageable pageable) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        String email = principal.getName();
        User currentUser = userService.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (sortBy == null || sortBy.isBlank()) {
            sortBy = "newest";
        }
        Sort sort;
        switch (sortBy) {
            case "oldest" -> sort = Sort.by(Sort.Direction.ASC, "createdAt");
            case "mostLiked" -> sort = Sort.by(Sort.Direction.DESC, "likes");
            case "mostViewed" -> sort = Sort.by(Sort.Direction.DESC, "views");
            default -> {
                sortBy = "newest";
                sort = Sort.by(Sort.Direction.DESC, "createdAt");
            }
        }

        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        Page<Post> postPage = postService.getAuthorPosts(currentUser.getId(), keyword, sortBy, sortedPageable);
        return ResponseEntity.ok(postPage);
    }

    // 🗑️ Delete Post (owner/admin)
    @DeleteMapping("/posts/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_AUTHOR','ROLE_ADMIN')")
    public ResponseEntity<?> deletePost(@PathVariable Long id, Principal principal) {
        Post existing = postService.findPostById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with Id: " + id));
        if (!canModify(existing, principal)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to delete this post");
        }
        postService.deletePostById(id);
        return ResponseEntity.noContent().build();
    }

    // Admin-only: Delete comment
    @DeleteMapping("/admin/comments/{commentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCommentAsAdmin(@PathVariable Long commentId) {
        Long postId = commentService.deleteCommentByAdmin(commentId);
        if (postId == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.noContent().build();
    }

    // Delete a single image from a post (owner/admin)
    @DeleteMapping("/posts/{postId}/images")
    @PreAuthorize("hasAnyAuthority('ROLE_AUTHOR','ROLE_ADMIN')")
    public ResponseEntity<Post> deleteImage(@PathVariable Long postId,
                                            @RequestParam("imageUrl") String imageUrl,
                                            Principal principal) {
        Post post = postService.findPostById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with Id: " + postId));
        assertCanModifyPost(post, principal);

        List<String> urls = post.getImageUrls();
        if (urls != null && urls.removeIf(u -> u.equals(imageUrl))) {
            post.setImageUrls(urls);
            postService.savePost(post, principal.getName());
            cloudinaryService.deleteMediaByUrl(imageUrl);
        }

        return ResponseEntity.ok(post);
    }

    // Delete a single image by index (handy for UI; keeps original behavior)
    @DeleteMapping("/posts/{postId}/images/{index}")
    @PreAuthorize("hasAnyAuthority('ROLE_AUTHOR','ROLE_ADMIN')")
    public ResponseEntity<Post> deleteImageByIndex(@PathVariable Long postId,
                                                   @PathVariable int index,
                                                   Principal principal) {
        Post post = postService.findPostById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with Id: " + postId));
        assertCanModifyPost(post, principal);

        List<String> urls = post.getImageUrls();
        if (urls != null && index >= 0 && index < urls.size()) {
            String urlToDelete = urls.get(index);
            urls.remove(index);
            post.setImageUrls(urls);
            postService.savePost(post, principal.getName());
            cloudinaryService.deleteMediaByUrl(urlToDelete);
        }

        return ResponseEntity.ok(post);
    }

    // Delete video from a post (owner/admin)
    @DeleteMapping("/posts/{postId}/video")
    @PreAuthorize("hasAnyAuthority('ROLE_AUTHOR','ROLE_ADMIN')")
    public ResponseEntity<Post> deleteVideo(@PathVariable Long postId, Principal principal) {
        Post post = postService.findPostById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with Id: " + postId));
        assertCanModifyPost(post, principal);

        String existingVideo = post.getVideoUrl();
        if (existingVideo != null) {
            post.setVideoUrl(null);
            postService.savePost(post, principal.getName());
            cloudinaryService.deleteMediaByUrl(existingVideo);
        }

        return ResponseEntity.ok(post);
    }

    private boolean canModify(Post post, Principal principal) {
        if (principal == null) return false;
        String email = principal.getName();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
        if (isAdmin) return true;
        User author = post.getUser();
        return author != null && author.getEmail() != null && author.getEmail().equalsIgnoreCase(email);
    }

    private void assertCanModifyPost(Post post, Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        String email = principal.getName();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
        boolean isOwner = post.getUser() != null && post.getUser().getEmail() != null
                && post.getUser().getEmail().equalsIgnoreCase(email);
        if (!isAdmin && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to modify this post");
        }
    }

    private String makeLinksClickable(String content) {
        if (content == null) return "";
        String urlRegex = "(https?://[^\\s]+)";
        if (content.toLowerCase().contains("<a ")) {
            return content;
        }
        return content.replaceAll(urlRegex, "<a href=\"$1\" target=\"_blank\" rel=\"noopener noreferrer\">$1</a>");
    }

    private String getBaseUrl(HttpServletRequest request) {
        String scheme = request.getScheme();
        String host = request.getServerName();
        int port = request.getServerPort();
        boolean defaultPort = (port == 80 || port == 443);
        return scheme + "://" + host + (defaultPort ? "" : ":" + port);
    }
}
