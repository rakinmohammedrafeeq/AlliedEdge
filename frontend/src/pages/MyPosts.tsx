import { useEffect, useState, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { postsApi, Post } from '@/lib/api';
import { useAuthContext } from '@/contexts/AuthContext';
import { PostCard } from '@/components/PostCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyPosts() {
  const { user } = useAuthContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const fetchMyPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const allPosts = await postsApi.getAll();
      // Filter posts by current user
      const myPosts = allPosts.filter((post: Post) => post.author.id === user?.id);
      setPosts(myPosts);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Failed to load your posts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchMyPosts();
    }
  }, [user, fetchMyPosts]);

  // Filter and sort posts
  useEffect(() => {
    let result = [...posts];

    // Apply keyword filter
    if (keyword.trim()) {
      result = result.filter((post) =>
        post.content.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'mostLiked':
        result.sort((a, b) => b.likes - a.likes);
        break;
      case 'mostViewed':
        // Assuming views property exists
        result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
    }

    setFilteredPosts(result);
  }, [posts, keyword, sortBy]);

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(posts.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
  };

  const handlePostDeleted = (postId: number) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header with Create Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            My Posts
          </h1>
          <Button asChild>
            <Link to="/posts/new">
              <Plus className="h-4 w-4 mr-2" />
              Create New Post
            </Link>
          </Button>
        </div>

        {/* Search and Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            type="text"
            placeholder="Search my posts..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-md bg-background"
          >
            <option value="newest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="mostLiked">Most Liked</option>
            <option value="mostViewed">Most Viewed</option>
          </select>
        </div>

        {/* Posts List */}
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
              <p className="text-muted-foreground mb-4">
                You haven't created any posts yet.
              </p>
              <Button asChild>
                <Link to="/posts/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Post
                </Link>
              </Button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No posts match your search. Try a different keyword.
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
