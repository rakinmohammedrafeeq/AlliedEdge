import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Newspaper, Eye, Home } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { adminUsersApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { DefaultAvatarFallback } from '@/components/DefaultAvatarFallback';

interface AdminUser {
  id: number;
  username: string;
  displayName?: string;
  email: string;
  profileImageUrl?: string;
  role?: string;
  admin: boolean;
  banned?: boolean;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get('keyword') || '';
  const pageFromUrl = Number(searchParams.get('page') || '0');
  const safePageFromUrl = Number.isFinite(pageFromUrl) && pageFromUrl >= 0 ? pageFromUrl : 0;

  const [searchInput, setSearchInput] = useState(keyword);

  // URL-driven pagination
  const [page, setPage] = useState(safePageFromUrl);
  const [size] = useState(10);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (user?.role !== 'ROLE_ADMIN') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role !== 'ROLE_ADMIN') return;

    const run = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const resp = await adminUsersApi.list({ keyword, page, size });
        const mapped: AdminUser[] = (resp.users || []).map((u: any) => ({
          id: Number(u.id),
          username: String(u.username || ''),
          displayName: (u.displayName as string | undefined) || undefined,
          email: String(u.email || ''),
          profileImageUrl: (u.profileImageUrl as string | undefined) || undefined,
          role: (u.role as string | undefined) || undefined,
          admin: Boolean(u.admin),
          banned: Boolean(u.banned),
        }));

        setUsers(mapped);
        setTotalUsers(Number(resp.totalUsers ?? 0));
        setTotalPages(Number(resp.totalPages ?? 0));

        // If we requested a page beyond the server range (can happen after search),
        // redirect to last page by updating URL (single source of truth).
        const tp = Number(resp.totalPages ?? 0);
        if (tp > 0 && page >= tp) {
          updateQuery({ page: Math.max(0, tp - 1) });
          return;
        }
      } catch (e) {
        console.error('Failed to load users:', e);
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(0);
        setLoadError('Failed to load users. Please try again.');
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [user?.role, keyword, page, size]);

  useEffect(() => {
    // Keep local page in sync with URL changes (back/forward/refresh)
    setPage(safePageFromUrl);
  }, [safePageFromUrl]);

  // Keep the search box synced with URL changes (back/forward, links)
  useEffect(() => {
    setSearchInput(keyword);
  }, [keyword]);

  const updateQuery = (next: { keyword?: string; page?: number }) => {
    const nextParams: Record<string, string> = {};
    const k = (next.keyword ?? keyword).trim();
    if (k) nextParams.keyword = k;

    const p = next.page ?? page;
    if (p > 0) nextParams.page = String(p);

    setSearchParams(nextParams);
  };

  const buildHref = (next: { keyword?: string; page?: number }) => {
    const q = new URLSearchParams();
    const k = (next.keyword ?? keyword).trim();
    if (k) q.set('keyword', k);
    const p = next.page ?? page;
    if (p > 0) q.set('page', String(p));
    const s = q.toString();
    return s ? `?${s}` : '';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const k = searchInput.trim();
    // Always go to first page when searching
    updateQuery({ keyword: k, page: 0 });
  };

  const clearSearch = () => {
    setSearchInput('');
    updateQuery({ keyword: '', page: 0 });
  };

  const toggleBan = async (target: AdminUser) => {
    if (!target?.id) return;

    if (target.admin) {
      toast.error('You cannot ban an admin user');
      return;
    }

    const nextBanned = !Boolean(target.banned);
    const actionLabel = nextBanned ? 'Ban' : 'Unban';

    const ok = window.confirm(
      `${actionLabel} @${target.username}? ${nextBanned ? 'They will not be able to log in.' : 'They will be able to log in again.'}`,
    );
    if (!ok) return;

    try {
      // Optimistic UI update
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, banned: nextBanned } : u)));

      if (nextBanned) {
        await adminUsersApi.ban(target.id);
        toast.success(`Banned @${target.username}`);
      } else {
        await adminUsersApi.unban(target.id);
        toast.success(`Unbanned @${target.username}`);
      }
    } catch (e) {
      // Revert optimistic update
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, banned: !nextBanned } : u)));
      console.error('Failed to toggle ban:', e);
      toast.error(`Failed to ${actionLabel.toLowerCase()} user`);
    }
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
            <Users className="h-8 w-8 text-primary" />
            User Management
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/posts">
                <Newspaper className="h-4 w-4 mr-2" />
                Manage Posts
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Card */}
        <Card className="mb-6 gradient-mesh-card">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <Users className="h-12 w-12 text-primary" />
              <div>
                <h2 className="text-4xl font-bold mb-1">{totalUsers}</h2>
                <p className="text-lg text-muted-foreground">Total Registered Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Section */}
        <Card className="gradient-mesh-card mb-6">
          <CardContent className="py-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by username, name, or email..."
                  className="pl-10"
                />
              </div>
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
            {keyword && (
              <div className="mt-3 text-sm text-muted-foreground">
                Showing results for: <strong>{keyword}</strong>{' '}
                <button onClick={clearSearch} className="text-primary hover:underline ml-2">
                  Clear
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="gradient-mesh-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h5 className="text-lg font-semibold mb-2">Loading users…</h5>
              </div>
            ) : loadError ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h5 className="text-lg font-semibold mb-2">{loadError}</h5>
                <p className="text-muted-foreground">Try again or refresh the page.</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h5 className="text-lg font-semibold mb-2">No users found</h5>
                {keyword && (
                  <p className="text-muted-foreground">
                    Try a different search term or{' '}
                    <button onClick={clearSearch} className="text-primary hover:underline">
                      view all users
                    </button>
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Profile</th>
                      <th className="px-4 py-3 text-left font-semibold">Full Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Role</th>
                      <th className="px-4 py-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((adminUser) => (
                      <tr key={adminUser.id} className="border-b last:border-b-0 hover:bg-muted/30">
                        {/* Profile Picture */}
                        <td className="px-4 py-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={adminUser.profileImageUrl} />
                            <AvatarFallback>
                              <DefaultAvatarFallback alt={adminUser.displayName || adminUser.username} />
                            </AvatarFallback>
                          </Avatar>
                        </td>

                        {/* Full Name */}
                        <td className="px-4 py-3">
                          <div>
                            <strong>
                              {adminUser.displayName || adminUser.username}
                            </strong>
                            <br />
                            <small className="text-muted-foreground">
                              @{adminUser.username}
                            </small>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3">{adminUser.email}</td>

                        {/* Role Badge */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 items-start">
                            {adminUser.admin ? (
                              <Badge variant="default">
                                <Users className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            ) : adminUser.role === 'ROLE_AUTHOR' ? (
                              <Badge variant="default">
                                <Newspaper className="h-3 w-3 mr-1" />
                                Author
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Users className="h-3 w-3 mr-1" />
                                User
                              </Badge>
                            )}

                            {adminUser.banned ? (
                              <Badge variant="destructive">Banned</Badge>
                            ) : null}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex gap-2 flex-wrap">
                            <Button variant="default" size="sm" asChild>
                              <Link to={`/admin/users/${adminUser.id}/posts`}>
                                <Newspaper className="h-4 w-4 mr-1" />
                                View Posts
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={`/profile/${adminUser.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Profile
                              </a>
                            </Button>

                            <Button
                              variant={adminUser.banned ? 'outline' : 'destructive'}
                              size="sm"
                              disabled={adminUser.admin}
                              onClick={() => toggleBan(adminUser)}
                              title={adminUser.admin ? 'Cannot ban admin users' : undefined}
                            >
                              {adminUser.banned ? 'Unban' : 'Ban'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {!isLoading && !loadError && totalPages > 1 && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong>
              {totalUsers ? (
                <> — <strong>{totalUsers}</strong> users</>
              ) : null}
            </p>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={buildHref({ page: Math.max(0, page - 1) })}
                    disabled={page === 0}
                    onClick={(e) => {
                      e.preventDefault();
                      updateQuery({ page: Math.max(0, page - 1) });
                    }}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(0, Math.min(page - 2, totalPages - 5));
                  const pageNumber = start + i;
                  if (pageNumber >= totalPages) return null;
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href={buildHref({ page: pageNumber })}
                        isActive={pageNumber === page}
                        onClick={(e) => {
                          e.preventDefault();
                          updateQuery({ page: pageNumber });
                        }}
                      >
                        {pageNumber + 1}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    href={buildHref({ page: Math.min(totalPages - 1, page + 1) })}
                    disabled={page >= totalPages - 1}
                    onClick={(e) => {
                      e.preventDefault();
                      updateQuery({ page: Math.min(totalPages - 1, page + 1) });
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>
    </div>
  );
}
