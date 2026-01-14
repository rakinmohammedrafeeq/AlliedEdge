import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuthContext } from '@/contexts/AuthContext';
import { announcementsApi, type Announcement, ApiError } from '@/lib/api';
import { AnimatedBackground } from '@/components/AnimatedBackground';

export default function Announcements() {
  const { user } = useAuthContext();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    // Close preview on Escape
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null);
    };
    if (previewImage) {
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
  }, [previewImage]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await announcementsApi.listPublic();
        if (!cancelled) setAnnouncements(data);
      } catch (e) {
        const message = e instanceof ApiError ? e.message : 'Failed to load announcements';
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Auto-play videos as they scroll into view
    const videos = document.querySelectorAll('.announcement-video');

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
    };

    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          video.play().catch((err) => console.log('Autoplay prevented:', err));
        } else {
          video.pause();
        }
      });
    }, observerOptions);

    videos.forEach((video) => {
      videoObserver.observe(video);
    });

    return () => {
      videos.forEach((video) => {
        videoObserver.unobserve(video);
      });
    };
  }, [announcements]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Image preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close image preview"
              className="absolute -top-3 -right-3 bg-background text-foreground rounded-full border shadow px-3 py-1"
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Announcement image preview"
              className="w-full max-h-[85vh] object-contain rounded-xl bg-black"
            />
          </div>
        </div>
      )}

      <div className="z-0">
        <AnimatedBackground />
      </div>

      <div className="relative z-10">
        <Navigation />

        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="mb-6 flex justify-end items-center">
            {user?.role === 'ROLE_ADMIN' && (
              <Button asChild>
                <Link to="/announcements/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Announcement
                </Link>
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : announcements.length === 0 ? (
            <Alert>
              <AlertDescription>No announcements at this time.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="gradient-mesh-card">
                  <CardContent className="pt-6">
                    <h5 className="text-xl font-bold mb-3 flex items-center gap-2">
                      <Bell className="h-5 w-5 text-yellow-500" />
                      {announcement.title}
                    </h5>
                    <p className="text-foreground/90 mb-4">{announcement.message}</p>

                    {/* Images Display */}
                    {announcement.imageUrls && announcement.imageUrls.length > 0 && (
                      <div className="mt-3 mb-3 space-y-4">
                        {announcement.imageUrls.map((src, idx) => (
                          <div key={idx} className="w-full flex justify-center">
                            <button
                              type="button"
                              onClick={() => setPreviewImage(src)}
                              className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                              aria-label={`View announcement image ${idx + 1}`}
                            >
                              <div className="w-[520px] max-w-full h-56 sm:h-72 rounded-xl border bg-black/5 overflow-hidden flex items-center justify-center">
                                <img
                                  src={src}
                                  alt={`Announcement image ${idx + 1}`}
                                  className="w-full h-full object-contain cursor-zoom-in"
                                  loading="lazy"
                                />
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Video Display */}
                    {announcement.videoUrl && (
                      <div className="mt-3 mb-3">
                        <video
                          controls
                          muted
                          loop
                          controlsList="nodownload noremoteplayback"
                          disablePictureInPicture
                          onContextMenu={(e) => e.preventDefault()}
                          className="announcement-video w-full rounded-lg"
                        >
                          <source src={announcement.videoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}

                    {announcement.createdAt && (
                      <Badge variant="secondary" className="mt-2">
                        {format(new Date(announcement.createdAt), 'yyyy-MM-dd HH:mm')}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Button variant="outline" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
