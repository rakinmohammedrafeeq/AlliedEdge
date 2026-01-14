import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { postsApi, Post, Comment } from '@/lib/api';
import { useAuthContext } from '@/contexts/AuthContext';
import { PostCard } from '@/components/PostCard';
import { CommentCard } from '@/components/CommentCard';
import { CreateCommentCard } from '@/components/CreateCommentCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, LogIn } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePostRealtime } from '@/hooks/usePostRealtime';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest' | 'mostReplied'>('newest');

  const fetchPost = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const data = await postsApi.getById(Number(id), { sortComments: commentSort });
      setPost(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch post:', err);
      setError('Failed to load post. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [id, commentSort]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Realtime: keep counts in sync for all users.
  usePostRealtime(
    post ? [post.id] : [],
    (stats) => {
      setPost((prev) => {
        if (!prev) return prev;
        if (prev.id !== stats.postId) return prev;
        return {
          ...prev,
          likes: typeof stats.likes === 'number' ? stats.likes : prev.likes,
          commentCount: typeof stats.commentCount === 'number'
            ? stats.commentCount
            : (prev.commentCount ?? prev.comments?.length ?? 0),
        };
      });
    },
  );

  const handlePostUpdated = (updatedPost: Post) => {
    setPost(updatedPost);
  };

  const handlePostDeleted = () => {
    navigate('/');
  };

  const handleCommentCreated = () => {
    // Keep UI snappy: bump comment count immediately.
    setPost((prev) => {
      if (!prev) return prev;
      const current = prev.commentCount ?? prev.comments?.length ?? 0;
      return { ...prev, commentCount: current + 1 };
    });

    // Also re-fetch to get the server's canonical comment list + counts.
    fetchPost();
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    if (post && post.comments) {
      setPost({
        ...post,
        comments: post.comments.map((comment) =>
          comment.id === updatedComment.id ? updatedComment : comment
        ),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="text-center py-12">
            <p className="text-destructive">{error || 'Post not found'}</p>
            <Button onClick={() => navigate('/')} variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Feed
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="space-y-6">
          <PostCard
            post={post}
            onPostUpdated={handlePostUpdated}
            onPostDeleted={handlePostDeleted}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Comments</h2>

              <div className="w-[200px]">
                <Select value={commentSort} onValueChange={(v) => setCommentSort(v as typeof commentSort)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Sort comments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="mostReplied">Most replied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isAuthenticated ? (
              <CreateCommentCard postId={post.id} onCommentCreated={handleCommentCreated} />
            ) : (
              <Card className="gradient-mesh-card">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Login to join the conversation
                  </p>
                  <Button asChild>
                    <Link to="/login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login or Sign Up
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {post.comments && post.comments.length > 0 ? (
              <div className="space-y-3">
                {post.comments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    onCommentUpdated={handleCommentUpdated}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
