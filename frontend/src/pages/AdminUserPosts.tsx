import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Newspaper, Calendar, Trash2, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { postsApi, usersApi, ApiError, isUnauthenticatedStatus, UNAUTHENTICATED_MESSAGE, type Post } from '@/lib/api';
import { DefaultAvatarFallback } from '@/components/DefaultAvatarFallback';

interface UserPost {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

interface UserProfile {
  id: number;
  username: string;
  displayName?: string;
  email: string;
  profileImageUrl?: string;
}

export default function AdminUserPosts() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuthContext();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    if (user?.role !== 'ROLE_ADMIN') {
      navigate('/');
      return;
    }

    if (!userId) {
      navigate('/admin/users');
      return;
    }
  }, [userId, user, navigate]);

  useEffect(() => {
    const load = async () => {
      if (user?.role !== 'ROLE_ADMIN') return;
      if (!userId) return;

      try {
        setIsLoading(true);

        // Fetch user info via search endpoint (best available in current API surface)
        const search = await usersApi.search('');
        const match = (search.users || []).find((u) => String(u.id) === String(userId));
        if (match) {
          setUserProfile({
            id: match.id,
            username: match.username || match.email || String(match.id),
            displayName: match.name,
            email: match.email,
            profileImageUrl: match.avatar,
          });
        } else {
          // Fallback to minimal profile
          setUserProfile({
            id: Number(userId),
            username: String(userId),
            displayName: 'User',
            email: '',
          });
        }

        // Fetch posts and filter by author
        const allPosts = await postsApi.getAll();
        const userPosts = allPosts.filter((p: Post) => String(p.author?.id) === String(userId));

        setPosts(
          userPosts.map((p) => ({
            id: p.id,
            title: (p.title && p.title.trim()) ? p.title : `Post #${p.id}`,
            content: p.content,
            createdAt: p.createdAt,
          }))
        );
        setTotalPosts(userPosts.length);
      } catch (error) {
        console.error('Failed to load admin user posts:', error);
        if (error instanceof ApiError) {
          const msg = isUnauthenticatedStatus(error.status)
            ? UNAUTHENTICATED_MESSAGE
            : (error.message || 'Failed to load posts');
          toast.error(msg);
        } else {
          toast.error('Failed to load posts');
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user?.role, userId]);

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await postsApi.delete(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setTotalPosts((prev) => Math.max(0, prev - 1));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  };

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (user?.role !== 'ROLE_ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Newspaper className="h-8 w-8 text-primary" />
            User Posts Management
          </h1>
          <Button variant="outline" asChild>
            <Link to="/admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !userProfile ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">User not found.</p>
          </div>
        ) : (
          <>
            {/* User Info Card */}
            <Card className="gradient-mesh-card mb-6">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border-2 border-border">
                      <AvatarImage src={userProfile.profileImageUrl} />
                      <AvatarFallback>
                        <DefaultAvatarFallback alt={userProfile.displayName || userProfile.username} />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">
                        {userProfile.displayName || userProfile.username}
                      </h2>
                      {userProfile.email && (
                        <p className="text-muted-foreground mb-1">
                          <span className="inline-block mr-4">
                            ✉️ {userProfile.email}
                          </span>
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        @{userProfile.username}
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-4xl font-bold text-primary mb-1">{totalPosts}</h3>
                    <p className="text-sm text-muted-foreground">Total Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts Table */}
            <Card className="gradient-mesh-card">
              <CardContent className="p-0">
                <div className="p-6 border-b">
                  <h5 className="text-lg font-semibold flex items-center gap-2">
                    <Newspaper className="h-5 w-5" />
                    Posts by {userProfile.displayName || userProfile.username}
                  </h5>
                </div>

                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <Newspaper className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h5 className="text-lg font-semibold mb-2">No posts found</h5>
                    <p className="text-muted-foreground">
                      This user hasn't created any posts yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold" style={{ width: '30%' }}>
                            Title
                          </th>
                          <th className="px-4 py-3 text-left font-semibold" style={{ width: '35%' }}>
                            Preview
                          </th>
                          <th className="px-4 py-3 text-left font-semibold" style={{ width: '20%' }}>
                            Created At
                          </th>
                          <th className="px-4 py-3 text-left font-semibold" style={{ width: '15%' }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {posts.map((post) => (
                          <tr key={post.id} className="border-b last:border-b-0 hover:bg-muted/30">
                            {/* Post Title */}
                            <td className="px-4 py-3">
                              <a
                                href={`/post/${post.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-semibold"
                              >
                                {post.title}
                              </a>
                            </td>

                            {/* Content Preview */}
                            <td className="px-4 py-3">
                              <div className="text-sm text-muted-foreground truncate max-w-md">
                                {stripHtml(post.content).substring(0, 50)}...
                              </div>
                            </td>

                            {/* Created At */}
                            <td className="px-4 py-3">
                              <div className="text-sm">
                                <Calendar className="h-4 w-4 inline mr-1" />
                                {format(new Date(post.createdAt), 'dd MMM yyyy')}
                                <br />
                                <span className="text-muted-foreground">
                                  {format(new Date(post.createdAt), 'HH:mm')}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
