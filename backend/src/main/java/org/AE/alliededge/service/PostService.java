package org.AE.alliededge.service;

import jakarta.transaction.Transactional;
import org.AE.alliededge.exception.ResourceNotFoundException;
import org.AE.alliededge.model.Post;
import org.AE.alliededge.model.PostLike;
import org.AE.alliededge.model.PostView;
import org.AE.alliededge.model.User;
import org.AE.alliededge.repository.PostLikeRepository;
import org.AE.alliededge.repository.PostRepository;
import org.AE.alliededge.repository.PostViewRepository;
import org.AE.alliededge.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostViewRepository postViewRepository;
    private final CloudinaryService cloudinaryService;

    private static final Logger LOGGER = Logger.getLogger(PostService.class.getName());

    public PostService(PostRepository postRepository,
                       UserRepository userRepository,
                       PostLikeRepository postLikeRepository,
                       PostViewRepository postViewRepository,
                       CloudinaryService cloudinaryService) {

        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.postLikeRepository = postLikeRepository;
        this.postViewRepository = postViewRepository;
        this.cloudinaryService = cloudinaryService;
    }

    public Page<Post> findAllPosts(Pageable pageable) {
        return postRepository.findAll(pageable);
    }

    public List<Post> findAllPosts() {
        return postRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public Page<Post> searchByTitle(String keyword, Pageable pageable) {
        return postRepository.findByTitleContainingIgnoreCase(keyword, pageable);
    }

    public Optional<Post> findPostById(Long id) {
        return postRepository.findById(id);
    }

    /** --------------------------------------------
     *  Create OR Update Post
     * -------------------------------------------- */
    @Transactional
    public Post savePost(Post postFromForm, String userEmail) {

        if (postFromForm.getContent() != null) {
            postFromForm.setContent(ContentLinkifier.linkify(postFromForm.getContent()));
        }

        /** CREATE NEW POST */
        if (postFromForm.getId() == null) {

            User author = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

            postFromForm.setUser(author);
            postFromForm.setCreatedAt(LocalDateTime.now());

            String displayName = (author.getDisplayName() != null && !author.getDisplayName().isBlank())
                    ? author.getDisplayName()
                    : author.getUsername();

            postFromForm.setAuthorName(displayName);
            postFromForm.setAuthorIsAdmin(author.isAdmin());

            LOGGER.info("Creating new post with videoUrl=" + postFromForm.getVideoUrl());
            return postRepository.save(postFromForm);
        }

        /** UPDATE EXISTING POST */
        Post existingPost = postRepository.findById(postFromForm.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + postFromForm.getId()));

        // Only overwrite fields that were actually provided.
        // The React UI often updates content only, so preserve title if not provided.
        if (postFromForm.getTitle() != null && !postFromForm.getTitle().isBlank()) {
            existingPost.setTitle(postFromForm.getTitle());
        }

        if (postFromForm.getContent() != null && !postFromForm.getContent().isBlank()) {
            existingPost.setContent(postFromForm.getContent());
        }

        // UPDATE IMAGES
        if (postFromForm.getImageUrls() != null) {
            existingPost.setImageUrls(postFromForm.getImageUrls());
        }

        // --- VIDEO DELETE / UPDATE LOGIC ---
        if (postFromForm.isDeleteVideo()) {
            // User requested deletion via checkbox on edit form
            String publicId = existingPost.getVideoPublicId();
            String url = existingPost.getVideoUrl();

            if (publicId != null && !publicId.isBlank()) {
                cloudinaryService.deleteVideoByPublicId(publicId);
            } else if (url != null && !url.isBlank()) {
                // Fallback: derive publicId from URL and delete as video
                String derivedPublicId = cloudinaryService.extractPublicId(url);
                if (derivedPublicId != null && !derivedPublicId.isBlank()) {
                    cloudinaryService.deleteVideoByPublicId(derivedPublicId);
                }
            }

            existingPost.setVideoUrl(null);
            existingPost.setVideoPublicId(null);
        } else {
            // If a new video URL was set (from controller upload), replace the previous one
            if (postFromForm.getVideoUrl() != null && !postFromForm.getVideoUrl().isBlank()) {
                String oldPublicId = existingPost.getVideoPublicId();
                String oldUrl = existingPost.getVideoUrl();

                if (oldPublicId != null && !oldPublicId.isBlank()) {
                    cloudinaryService.deleteVideoByPublicId(oldPublicId);
                } else if (oldUrl != null && !oldUrl.isBlank()) {
                    String derivedPublicId = cloudinaryService.extractPublicId(oldUrl);
                    if (derivedPublicId != null && !derivedPublicId.isBlank()) {
                        cloudinaryService.deleteVideoByPublicId(derivedPublicId);
                    }
                }

                existingPost.setVideoUrl(postFromForm.getVideoUrl());
                // Optionally, update videoPublicId based on new URL
                String newPublicId = cloudinaryService.extractPublicId(postFromForm.getVideoUrl());
                existingPost.setVideoPublicId(newPublicId);
            }
        }

        LOGGER.info("Updating post id=" + existingPost.getId());
        return postRepository.save(existingPost);
    }

    /** --------------------------------------------
     *  DELETE POST (and everything in Cloudinary)
     * -------------------------------------------- */
    @Transactional
    public void deletePostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + id));

        // Delete video if present
        deleteVideo(post);

        // Likes + Views
        postLikeRepository.deleteByPost(post);
        postViewRepository.deleteByPost(post);

        postRepository.delete(post);
    }

    /** --------------------------------------------
     *  DELETE VIDEO FROM CLOUDINARY
     * -------------------------------------------- */
    private void deleteVideo(Post post) {
        if (post.getVideoUrl() == null || post.getVideoUrl().isBlank()) {
            return;
        }

        String publicId = cloudinaryService.extractPublicId(post.getVideoUrl());

        try {
            cloudinaryService.deleteVideoByPublicId(publicId);
            LOGGER.info("Deleted Cloudinary video: " + publicId);
        } catch (Exception e) {
            LOGGER.warning("Failed to delete video: " + e.getMessage());
        }

        post.setVideoUrl(null);
        postRepository.save(post);
    }

    /** --------------------------------------------
     * LIKE / UNLIKE
     * -------------------------------------------- */
    @Transactional
    public boolean toggleLike(Long postId, String userEmail) {

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + postId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        if (post.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot like your own post.");
        }

        boolean alreadyLiked = postLikeRepository.existsByPostAndUser(post, user);
        if (alreadyLiked) {
            postLikeRepository.deleteByPostAndUser(post, user);
        } else {
            PostLike like = new PostLike();
            like.setPost(post);
            like.setUser(user);
            postLikeRepository.save(like);
        }

        long count = postLikeRepository.countByPost(post);
        post.setLikes((int) count);
        postRepository.save(post);

        return !alreadyLiked;
    }

    public boolean hasUserLiked(Post post, String userEmail) {
        if (userEmail == null) return false;
        User user = userRepository.findByEmail(userEmail).orElse(null);
        return user != null && postLikeRepository.existsByPostAndUser(post, user);
    }

    /** --------------------------------------------
     * VIEWS
     * -------------------------------------------- */
    @Transactional
    public void incrementViews(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + postId));
        post.setViews(post.getViews() + 1);
        postRepository.save(post);
    }

    @Transactional
    public Post recordView(Long postId, String userEmail) {

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + postId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        if (!postViewRepository.existsByPostAndUser(post, user)) {
            PostView pv = new PostView();
            pv.setPost(post);
            pv.setUser(user);
            pv.setViewedAt(LocalDateTime.now());
            postViewRepository.save(pv);

            long views = postViewRepository.countByPost(post);
            post.setViews((int) views);
            postRepository.save(post);
        }

        return post;
    }

    /** --------------------------------------------
     * SORTING + FILTERS
     * -------------------------------------------- */
    public Sort resolveSort(String sortBy) {
        if (sortBy == null || sortBy.isEmpty() || sortBy.equals("newest"))
            return Sort.by(Sort.Direction.DESC, "createdAt");

        switch (sortBy) {
            case "oldest": return Sort.by(Sort.Direction.ASC, "createdAt");
            case "mostLiked": return Sort.by(Sort.Direction.DESC, "likes");
            case "mostViewed": return Sort.by(Sort.Direction.DESC, "views");
            default: return Sort.by(Sort.Direction.DESC, "createdAt");
        }
    }

    public Page<Post> getAllPosts(String keyword, String sortBy, Pageable pageable) {
        Sort sort = resolveSort(sortBy);
        Pageable sorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        String kw = (keyword == null) ? null : keyword.trim();
        if (kw != null && !kw.isBlank()) {
            return postRepository.searchAllPosts(kw, sorted);
        }

        return postRepository.findAll(sorted);
    }

    public Page<Post> getAuthorPosts(Long authorId, String keyword, String sortBy, Pageable pageable) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + authorId));

        Sort sort = resolveSort(sortBy);
        Pageable sorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        String kw = (keyword == null) ? null : keyword.trim();
        if (kw != null && !kw.isBlank()) {
            return postRepository.searchPostsByAuthor(author, kw, sorted);
        }

        return postRepository.findByUser(author, sorted);
    }

    public List<Post> findPostsByUserId(Long userId) {
        return userRepository.findById(userId)
                .map(postRepository::findByUserOrderByCreatedAtDesc)
                .orElse(List.of());
    }
}
