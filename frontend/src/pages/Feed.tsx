import { useEffect, useState, useCallback, useRef } from 'react';
import { Navigation } from '@/components/Navigation';
import { RightSidebar } from '@/components/RightSidebar';
import { postsApi, usersApi, User, Post, ApiError, UNAUTHENTICATED_MESSAGE, isUnauthenticatedStatus } from '@/lib/api';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Heart, MessageCircle, Calendar, Share2, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { ImageCarousel } from '@/components/ImageCarousel';
import { AutoPlayMutedVideo } from '@/components/AutoPlayMutedVideo';
import { DefaultAvatarFallback } from '@/components/DefaultAvatarFallback';
import { usePostRealtime } from '@/hooks/usePostRealtime';
import { formatCount } from '@/lib/formatCount';
import { VerifiedBadge } from '@/components/VerifiedBadge';

export default function Feed() {
  const { isAuthenticated, user } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 10;

  const postsSearchKeyword = searchParams.get('search') || '';
  const userSearchKeyword = searchParams.get('userSearch') || '';

  const [userResults, setUserResults] = useState<User[]>([]);
  const [userSearchInput, setUserSearchInput] = useState(userSearchKeyword);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');

  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setUserSearchInput(userSearchKeyword);
  }, [userSearchKeyword]);

  const fetchUsers = useCallback(async () => {
    if (!userSearchKeyword.trim()) return;
    try {
      setIsUserLoading(true);
      setUserError(null);
      const resp = await usersApi.search(userSearchKeyword.trim());
      setUserResults(resp.users || []);
    } catch (err) {
      console.error('Failed to search users:', err);
      setUserResults([]);
      setUserError('Failed to load users. Please try again later.');
      toast.error('Failed to load users');
    } finally {
      setIsUserLoading(false);
    }
  }, [userSearchKeyword]);

  const fetchPostsPage = useCallback(async (opts: { page: number; append: boolean }) => {
    // Prevent overlapping requests (but don't block initial load forever)
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    // Cancel any previous request if still running
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (opts.append) setIsLoadingMore(true);
      else setIsLoading(true);

      // Ask postsApi for both items + paging metadata in one shot.
      const { items, pageInfo } = await postsApi.fetchPostsPaged({
        page: opts.page,
        size: pageSize,
        sortBy,
        keyword: postsSearchKeyword || undefined,
        signal: controller.signal,
      });

      setPosts((prev) => (opts.append ? [...prev, ...items] : items));
      setError(null);

      if (pageInfo) {
        setHasMorePosts(!pageInfo.last);
        setPage(pageInfo.pageNumber);
      } else {
        setHasMorePosts(items.length === pageSize);
        setPage(opts.page);
      }
    } catch (err: unknown) {
      // Ignore aborts
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      const status = err instanceof ApiError ? err.status : undefined;
      console.error('Failed to fetch posts:', err);

      if (isUnauthenticatedStatus(status)) {
        // Logged-out users: load only the first page, then gate further loads.
        try {
          const data = await postsApi.getPublic();
          setPosts(data);
          setError(null);
          setHasMorePosts(false);
          setPage(0);
          return;
        } catch (fallbackErr) {
          console.error('Fallback to public posts failed:', fallbackErr);
        }
      }

      const message = isUnauthenticatedStatus(status)
        ? UNAUTHENTICATED_MESSAGE
        : 'Failed to load posts. Please try again later.';

      setError(message);
      toast.error(message);
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [pageSize, postsSearchKeyword, sortBy]);

  // Reset pagination whenever sort/search changes.
  useEffect(() => {
    if (userSearchKeyword.trim()) return; // user search mode uses different list
    setPosts([]);
    setPage(0);
    setHasMorePosts(true);
    fetchPostsPage({ page: 0, append: false });
  }, [fetchPostsPage, sortBy, postsSearchKeyword, userSearchKeyword]);

  // Infinite scroll: only for authenticated users and only for posts list mode.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (userSearchKeyword.trim()) return;
    if (!hasMorePosts) return;
    if (isLoadingMore || isLoading) return;

    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (inFlightRef.current) return;
        fetchPostsPage({ page: page + 1, append: true });
      },
      { root: null, rootMargin: '300px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchPostsPage, hasMorePosts, isAuthenticated, isLoading, isLoadingMore, page, userSearchKeyword]);

  const handleLike = async (postId: number) => {
    if (!isAuthenticated) {
      toast.error('Please login to like posts');
      return;
    }
    try {
      const updated = await postsApi.like(postId);

      // like endpoint returns { id, likes, liked }
      const nextLikedByMe = typeof (updated as any).liked === 'boolean'
        ? (updated as any).liked
        : undefined;

      setPosts(prev => prev.map(p => {
        if (p.id !== updated.id) return p;
        return {
          ...p,
          likes: updated.likes,
          likedByMe: nextLikedByMe ?? !p.likedByMe,
        };
      }));

      toast.success((nextLikedByMe ?? true) ? 'Post liked!' : 'Post unliked');
    } catch (error) {
      console.error('Failed to like post:', error);
      if (error instanceof ApiError) {
        const msg = isUnauthenticatedStatus(error.status)
          ? UNAUTHENTICATED_MESSAGE
          : (error.message || 'Failed to like post');
        toast.error(msg);
      } else {
        toast.error('Failed to like post');
      }
    }
  };

  const handleShare = (postId: number) => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!');
    });
  };

  const clearUserSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('userSearch');
    setSearchParams(next);
  };

  const submitUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = userSearchInput.trim();
    const next = new URLSearchParams(searchParams);
    if (q) {
      next.set('userSearch', q);
      next.delete('search');
    } else {
      next.delete('userSearch');
    }
    setSearchParams(next);
  };

  const filteredPosts = posts
    .filter((post) => {
      const q = postsSearchKeyword.trim().toLowerCase();
      if (!q) return true;

      const haystacks = [
        post.title,
        post.content,
        post.author?.name,
        post.author?.username,
      ]
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        .map((v) => v.toLowerCase());

      return haystacks.some((h) => h.includes(q));
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'mostLiked':
          return b.likes - a.likes;
        case 'mostViewed':
          return (b.views ?? 0) - (a.views ?? 0);
        default: // newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  useEffect(() => {
    if (userSearchKeyword.trim()) {
      fetchUsers();
    }
  }, [fetchUsers, userSearchKeyword]);

  const retryPosts = () => {
    fetchPostsPage({ page: 0, append: false });
  };

  // Realtime: patch likes/commentCount as they change for any user.
  usePostRealtime(
    filteredPosts.map((p) => p.id),
    (stats) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === stats.postId
            ? {
                ...p,
                likes: typeof stats.likes === 'number' ? stats.likes : p.likes,
                commentCount:
                  typeof stats.commentCount === 'number'
                    ? stats.commentCount
                    : (p.commentCount ?? p.comments?.length ?? 0),
              }
            : p,
        ),
      );
    },
  );

  return (
    <div className="min-h-screen bg-background feed-animated-bg">
      <Navigation />

      {/* 3-column layout to center the feed between left edge and right sidebar */}
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,48rem)_20rem] xl:grid-cols-[1fr_minmax(0,48rem)_20rem] gap-6">
          {/* Left spacer column (keeps the main column centered between edges + sidebar) */}
          <div className="hidden lg:block" />

          {/* Main Content */}
          <main className="min-w-0">
            {userSearchKeyword.trim() ? (
              <>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">User Results</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Showing results for: <span className="font-medium">{userSearchKeyword}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form onSubmit={submitUserSearch} className="flex items-center gap-2">
                      <Input
                        value={userSearchInput}
                        onChange={(e) => setUserSearchInput(e.target.value)}
                        placeholder="Search users..."
                        className="w-56"
                      />
                      <Button type="submit" variant="outline" size="sm">
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                    </form>
                    <Button variant="ghost" size="sm" onClick={clearUserSearch}>
                      Clear
                    </Button>
                  </div>
                </div>

                {isUserLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : userError ? (
                  <div className="text-center py-12 space-y-4">
                    <p className="text-destructive">{userError}</p>
                    <Button variant="outline" onClick={clearUserSearch}>Back to posts</Button>
                  </div>
                ) : userResults.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No users found matching your search.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userResults.map((u) => (
                      <Card key={u.id} className="gradient-mesh-card overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <Link to={`/profile/${u.id}`} className="shrink-0">
                              <Avatar className="h-12 w-12 border">
                                <AvatarImage src={u.avatar} />
                                <AvatarFallback>
                                  <DefaultAvatarFallback alt={u.name || u.username || 'Default profile image'} />
                                </AvatarFallback>
                              </Avatar>
                            </Link>
                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/profile/${u.id}`}
                                className="font-semibold hover:text-primary transition-colors"
                              >
                                {u.name}
                              </Link>
                              {u.username && (
                                <p className="text-sm text-muted-foreground truncate">@{u.username}</p>
                              )}
                              <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/profile/${u.id}`}>View Profile</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Toolbar: Title + Sort */}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">Latest Posts</h1>
                    {postsSearchKeyword && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Showing results for: <span className="font-medium">{postsSearchKeyword}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="sortBy" className="text-sm text-muted-foreground">
                      Sort by:
                    </label>
                    <select
                      id="sortBy"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1.5 border border-border rounded-md text-sm bg-background"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="mostLiked">Most Liked</option>
                      <option value="mostViewed">Most Viewed</option>
                    </select>
                  </div>
                </div>

                {/* Posts */}
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12 space-y-4">
                    <p className="text-destructive">{error}</p>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" onClick={retryPosts}>Retry</Button>
                      {error === UNAUTHENTICATED_MESSAGE && (
                        <Button asChild variant="default">
                          <Link to="/login">Log in</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {postsSearchKeyword ? 'No posts found matching your search.' : 'No posts yet. Be the first to share something!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredPosts.map((post) => (
                      <Card key={post.id} className="gradient-mesh-card overflow-hidden">
                        <CardContent className="p-6 relative">
                          {/* Post Header */}
                          <div className="mb-4">
                            <h2 className="text-xl font-bold mb-2">
                              <Link
                                to={`/post/${post.id}`}
                                className="hover:text-primary transition-colors"
                              >
                                {(post.title && post.title.trim())
                                  ? post.title
                                  : `${post.content.substring(0, 100)}${post.content.length > 100 ? '…' : ''}`}
                              </Link>
                            </h2>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground items-center">
                              <Link
                                to={`/profile/${post.author.id}`}
                                className="flex items-center gap-2 hover:opacity-90 transition-opacity"
                                aria-label={`View profile of ${post.author.name}`}
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={post.author.avatar} />
                                  <AvatarFallback>
                                    <DefaultAvatarFallback alt={post.author.name} />
                                  </AvatarFallback>
                                </Avatar>
                                <span>
                                  Posted by{' '}
                                  <span className="font-medium text-foreground hover:text-primary transition-colors">
                                    {post.author.name}
                                  </span>
                                </span>
                              </Link>
                              <span className="flex items-center gap-1">
                                <VerifiedBadge show={post.author.role === 'ROLE_ADMIN'} size={12} title="Admin" />
                                <Calendar className="h-4 w-4" />
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>

                          {/* Post Content */}
                          <div className="mb-4">
                            <p className="whitespace-pre-wrap">{post.content}</p>
                          </div>

                          {/* Media (Cloudinary) */}
                          {(post.videoUrl || (post.imageUrls && post.imageUrls.length > 0)) && (
                            <div className="mb-4 space-y-3">
                              {post.videoUrl && (
                                <AutoPlayMutedVideo src={post.videoUrl} />
                              )}

                              {post.imageUrls && post.imageUrls.length > 0 && (
                                <ImageCarousel imageUrls={post.imageUrls} heightClassName="h-72" />
                              )}
                            </div>
                          )}

                          {/* Bottom-right views */}
                          <div className="absolute bottom-4 right-6 text-xs text-muted-foreground">
                            {formatCount(post.views ?? 0)} views
                          </div>

                          {/* Post Actions */}
                          <div className="flex flex-wrap gap-3 items-center">
                            {/* Like Button */}
                            {isAuthenticated ? (
                              <Button
                                variant={post.likedByMe ? "ghost" : "outline"}
                                size="sm"
                                onClick={() => {
                                  if (post.author.id === user?.id) {
                                    toast.error('You cannot like your own post');
                                    return;
                                  }
                                  handleLike(post.id);
                                }}
                                className={
                                  post.likedByMe
                                    ? "rounded-full border border-transparent text-white bg-linear-to-r from-[rgb(75,85,99)] via-[rgb(55,65,81)] to-[rgb(31,41,55)] dark:from-[rgb(34,211,238)] dark:via-[rgb(6,182,212)] dark:to-[rgb(8,145,178)] shadow-lg brightness-110 hover:bg-linear-to-r hover:from-[rgb(75,85,99)] hover:via-[rgb(55,65,81)] hover:to-[rgb(31,41,55)] dark:hover:from-[rgb(34,211,238)] dark:hover:via-[rgb(6,182,212)] dark:hover:to-[rgb(8,145,178)] hover:brightness-110 focus-visible:ring-0"
                                    : ""
                                }
                              >
                                <Heart className={`h-4 w-4 mr-2 ${post.likedByMe ? 'fill-current' : ''}`} />
                                {formatCount(post.likes)}
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/login?redirect=${encodeURIComponent(`/post/${post.id}`)}`}>
                                  <Heart className="h-4 w-4 mr-2" />
                                  {formatCount(post.likes)}
                                </Link>
                              </Button>
                            )}

                            {/* Comment Button */}
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/post/${post.id}`}>
                                <MessageCircle className="h-4 w-4 mr-2" />
                                {formatCount(post.commentCount ?? post.comments?.length ?? 0)}
                              </Link>
                            </Button>


                            {/* Share Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShare(post.id)}
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Load more */}
                {isAuthenticated ? (
                  hasMorePosts && filteredPosts.length > 0 && (
                    <div ref={loadMoreRef} className="flex justify-center items-center py-4">
                      {isLoadingMore ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      ) : (
                        <p className="text-sm text-muted-foreground">Scroll to load more posts…</p>
                      )}
                    </div>
                  )
                ) : (
                  // Only show the login gate after we successfully rendered at least one page
                  posts.length > 0 && (
                    <div className="mt-6 rounded-lg border bg-card/40 p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Log in to load more posts.
                      </p>
                      <Button asChild variant="default" size="sm" className="mt-3">
                        <Link to="/login">Log in</Link>
                      </Button>
                    </div>
                  )
                )}
              </>
            )}
          </main>

          {/* Right Sidebar */}
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
