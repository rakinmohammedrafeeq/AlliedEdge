import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { postsApi, Post, adminStatsApi } from '@/lib/api';
import { useAuthContext } from '@/contexts/AuthContext';
import { PostCard } from '@/components/PostCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, Users, FileText, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [stats, setStats] = useState<{ activeUsers: number; totalLikes: number; totalComments: number } | null>(null);

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== 'ROLE_ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchPostsPage = async (nextPage: number, opts: { initial?: boolean } = {}) => {
    try {
      if (opts.initial) setIsLoading(true);
      else setIsPageLoading(true);

      const { items, pageInfo } = await postsApi.fetchAdminPaged({ page: nextPage, size });
      setPosts(items);
      setPage(pageInfo?.pageNumber ?? nextPage);
      setTotalPages(pageInfo?.totalPages ?? 1);
      setTotalElements(pageInfo?.totalElements ?? items.length);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ROLE_ADMIN') {
      fetchPostsPage(0, { initial: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch accurate admin aggregates (users/likes/comments)
  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      if (user?.role !== 'ROLE_ADMIN') return;
      try {
        const s = await adminStatsApi.postStats();
        if (!cancelled) setStats(s);
      } catch (err) {
        console.warn('Failed to load admin stats:', err);
        if (!cancelled) setStats(null);
      }
    };

    void loadStats();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(posts.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
  };

  const handlePostDeleted = (postId: number) => {
    // If you delete the last item on a page, refresh to keep pagination consistent.
    const next = posts.filter((post) => post.id !== postId);
    setPosts(next);
    const isNowEmptyPage = next.length === 0 && page > 0;
    void fetchPostsPage(isNowEmptyPage ? page - 1 : page);
  };

  if (user?.role !== 'ROLE_ADMIN') {
    return null;
  }

  const totalLikes = stats?.totalLikes ?? posts.reduce((sum, post) => sum + post.likes, 0);
  const totalComments =
    stats?.totalComments ??
    posts.reduce((sum, post) => {
      const anyPost = post as unknown as { commentCount?: number };
      return sum + (anyPost.commentCount ?? post.comments?.length ?? 0);
    }, 0);
  const activeUsers =
    stats?.activeUsers ??
    new Set(posts.map((p) => p.author.id)).size;

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="gradient-mesh-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalElements}</div>
            </CardContent>
          </Card>

          <Card className="gradient-mesh-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeUsers}</div>
            </CardContent>
          </Card>

          <Card className="gradient-mesh-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLikes}</div>
            </CardContent>
          </Card>

          <Card className="gradient-mesh-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalComments}</div>
            </CardContent>
          </Card>
        </div>

        {/* All Posts */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold">All Posts</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isPageLoading && (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading page…
                </span>
              )}
              <span>
                Page {page + 1} of {Math.max(totalPages, 1)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mb-6">
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              disabled={isLoading || isPageLoading || page <= 0}
              onClick={() => fetchPostsPage(page - 1)}
            >
              Previous
            </button>
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              disabled={isLoading || isPageLoading || page >= totalPages - 1}
              onClick={() => fetchPostsPage(page + 1)}
            >
              Next
            </button>
          </div>

          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive">{error}</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No posts available.</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
