import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Plus, Eye, EyeOff, Edit, Trash2, Video, ArrowLeft, Info, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { announcementsApi, ApiError, type Announcement } from '@/lib/api';

export default function AdminAnnouncements() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const load = async (nextPage: number, opts: { initial?: boolean } = {}) => {
    if (opts.initial) setIsLoading(true);
    else setIsPageLoading(true);

    try {
      const { items, pageInfo } = await announcementsApi.listAdminPaged({ page: nextPage, size });
      setAnnouncements(items);
      setPage(pageInfo?.pageNumber ?? nextPage);
      setTotalPages(pageInfo?.totalPages ?? 1);
      setTotalElements(pageInfo?.totalElements ?? items.length);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load announcements';
      toast.error(msg);
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'ROLE_ADMIN') {
      navigate('/');
      return;
    }

    void load(0, { initial: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const handleToggleVisible = async (id: number) => {
    try {
      await announcementsApi.toggleVisible(id);
      await load(page, { initial: false });
      toast.success('Visibility updated');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to update visibility';
      toast.error(msg);
    }
  };

  const handleDeleteVideo = async (id: number) => {
    if (!confirm('Delete this video?')) return;
    try {
      await announcementsApi.deleteVideo(id);
      await load(page, { initial: false });
      toast.success('Video deleted');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to delete video';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await announcementsApi.delete(id);
      // If we deleted the last row on the page, go back one page.
      const next = announcements.filter((a) => a.id !== id);
      const isNowEmptyPage = next.length === 0 && page > 0;
      await load(isNowEmptyPage ? page - 1 : page, { initial: false });
      toast.success('Announcement deleted');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to delete announcement';
      toast.error(msg);
    }
  };

  if (user?.role !== 'ROLE_ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            Manage Announcements
          </h1>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/announcements/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Link>
            </Button>
          </div>
        </div>

        <Button variant="outline" asChild className="mb-4">
          <Link to="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Link>
        </Button>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="text-sm text-muted-foreground">
                {isPageLoading && (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading page…
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Page {page + 1} of {Math.max(totalPages, 1)}
                </span>
                <span>({totalElements} total)</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mb-4">
              <Button
                variant="outline"
                disabled={isPageLoading || page <= 0}
                onClick={() => void load(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={isPageLoading || page >= totalPages - 1}
                onClick={() => void load(page + 1)}
              >
                Next
              </Button>
            </div>

            {/* Empty State */}
            {announcements.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No announcements yet. Click "Create Announcement" to add one.
                </AlertDescription>
              </Alert>
            )}

            {/* Announcements Table */}
            {announcements.length > 0 && (
              <Card className="gradient-mesh-card">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Title</th>
                          <th className="px-4 py-3 text-left font-semibold">Message</th>
                          <th className="px-4 py-3 text-left font-semibold">Date</th>
                          <th className="px-4 py-3 text-center font-semibold">Video</th>
                          <th className="px-4 py-3 text-center font-semibold">Visible</th>
                          <th className="px-4 py-3 text-center font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {announcements.map((announcement) => (
                          <tr key={announcement.id} className="border-b last:border-b-0 hover:bg-muted/30">
                            {/* Title */}
                            <td className="px-4 py-3">
                              <strong>{announcement.title}</strong>
                            </td>

                            {/* Message (truncated) */}
                            <td className="px-4 py-3 max-w-xs">
                              <div className="truncate text-muted-foreground text-sm">
                                {announcement.message}
                              </div>
                            </td>

                            {/* Date */}
                            <td className="px-4 py-3">
                              <Badge variant="secondary">
                                {format(new Date(announcement.createdAt ?? ''), 'dd-MMM-yyyy HH:mm')}
                              </Badge>
                            </td>

                            {/* Video Status */}
                            <td className="px-4 py-3 text-center">
                              {announcement.videoUrl ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Badge variant="default">
                                    <Video className="h-3 w-3 mr-1" />
                                    Video
                                  </Badge>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      className="h-6 px-2 text-xs"
                                    >
                                      <a href={announcement.videoUrl} target="_blank" rel="noopener noreferrer">
                                        <Eye className="h-3 w-3" />
                                      </a>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteVideo(announcement.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </td>

                            {/* Visible Toggle */}
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant={announcement.visible ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleToggleVisible(announcement.id)}
                              >
                                {announcement.visible ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </Button>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-center">
                              <div className="flex gap-1 justify-center">
                                <Button variant="default" size="sm" asChild>
                                  <Link to={`/admin/announcements/edit/${announcement.id}`}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Link>
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(announcement.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
