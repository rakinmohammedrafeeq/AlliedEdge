import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, FileText, Users } from 'lucide-react';
import { DefaultAvatarFallback } from '@/components/DefaultAvatarFallback';
import { usersApi, type User as ApiUser } from '@/lib/api';
import { useAuthContext } from '@/contexts/AuthContext';

interface SearchUser {
  id: number;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  resumeUrl?: string;
  resumePublicId?: string;
}

export default function UserSearch() {
  const { user: currentUser } = useAuthContext();
  const currentUserId = currentUser?.id;

  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const [searchInput, setSearchInput] = useState(keyword);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (keyword) {
      searchUsers(keyword);
    }
  }, [keyword]);

  const searchUsers = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const resp = await usersApi.search(query.trim());
      const rawUsers = (resp.users || []) as ApiUser[];

      // Backend should already exclude current user, but filter client-side as defense-in-depth.
      const filtered = (rawUsers as any[]).filter((u) => {
        const id = (u?.id as number | undefined) ?? undefined;
        return currentUserId == null || id == null || id !== currentUserId;
      });

      setUsers(filtered as SearchUser[]);
    } catch (error) {
      console.error('Failed to search users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ keyword: searchInput.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            User Search
          </h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search users by name or username..."
              className="flex-1"
            />
            <Button type="submit" className="search-button">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </div>

        {keyword && (
          <div className="mb-4">
            <p className="text-muted-foreground">
              Search results for: <strong>"{keyword}"</strong>
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 && keyword ? (
          <Card className="gradient-mesh-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No users found matching your search.</p>
            </CardContent>
          </Card>
        ) : users.length === 0 ? (
          <Card className="gradient-mesh-card">
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Enter a name or username to search for users
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <Card key={user.id} className="gradient-mesh-card hover:shadow-lg transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Link to={`/profile/${user.id}`}>
                      <Avatar className="h-12 w-12 border-2 border-border">
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback>
                          <DefaultAvatarFallback alt={user.displayName || user.username} />
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/profile/${user.id}`}
                        className="text-lg font-semibold hover:text-primary transition-colors"
                      >
                        {user.displayName || user.username}
                      </Link>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>

                    {/* Resume Button */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/profile/${user.id}`}>
                          <FileText className="h-4 w-4 mr-1" />
                          View Resume
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
