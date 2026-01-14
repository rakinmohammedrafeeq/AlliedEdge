import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, X, Trash2, Upload, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { announcementsApi, ApiError } from '@/lib/api';

export default function AnnouncementEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    visible: true,
    videoUrl: '',
    removeVideo: false,
    removeImages: false,
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (user?.role !== 'ROLE_ADMIN') {
      navigate('/');
      return;
    }

    const numericId = Number(id);
    if (!numericId) {
      toast.error('Invalid announcement id');
      navigate('/admin/announcements');
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const a = await announcementsApi.getAdmin(numericId);
        if (cancelled) return;

        setFormData({
          title: a.title ?? '',
          message: a.message ?? '',
          visible: a.visible ?? true,
          videoUrl: a.videoUrl ?? '',
          removeVideo: false,
          removeImages: false,
        });
        setExistingImages(Array.isArray(a.imageUrls) ? a.imageUrls : []);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Failed to load announcement';
        toast.error(msg);
        navigate('/admin/announcements');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, user, navigate]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video file must be less than 100MB');
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);

    // If user picked a replacement, we should not remove the existing video.
    setFormData((prev) => ({ ...prev, removeVideo: false }));
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const bad = files.find((f) => !f.type.startsWith('image/'));
    if (bad) {
      toast.error('Please select valid image files');
      return;
    }

    const maxEach = 10 * 1024 * 1024;
    const tooLarge = files.find((f) => f.size > maxEach);
    if (tooLarge) {
      toast.error('Each image must be less than 10MB');
      return;
    }

    const next = files.slice(0, 6);
    setImageFiles(next);
    setImagePreviews(next.map((f) => URL.createObjectURL(f)));

    // If user is adding images, they probably don't want to wipe existing ones.
    setFormData((prev) => ({ ...prev, removeImages: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericId = Number(id);
    if (!numericId) {
      toast.error('Invalid announcement id');
      return;
    }

    setSaving(true);
    try {
      await announcementsApi.update(numericId, {
        title: formData.title,
        message: formData.message,
        visible: formData.visible,
        removeImages: formData.removeImages,
        imageFiles,
        removeVideo: formData.removeVideo,
        videoFile,
      });

      toast.success('Announcement updated successfully!');
      navigate('/admin/announcements');
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Failed to update announcement';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'ROLE_ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="outline" asChild className="mb-4">
            <Link to="/admin/announcements">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Announcements
            </Link>
          </Button>
          <h2 className="text-3xl font-bold">Edit Announcement</h2>
        </div>

        <Card className="gradient-mesh-card">
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter announcement title"
                    required
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Enter announcement message"
                    rows={5}
                    required
                  />
                </div>

                {/* Existing Video */}
                {formData.videoUrl && !formData.removeVideo && (
                  <div className="space-y-2">
                    <Label>Current Video</Label>
                    <video controls className="w-full max-h-64 rounded-lg" src={formData.videoUrl}>
                      Your browser does not support the video tag.
                    </video>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="removeVideo"
                        checked={formData.removeVideo}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, removeVideo: checked as boolean })
                        }
                      />
                      <Label htmlFor="removeVideo" className="cursor-pointer">
                        <Trash2 className="h-4 w-4 inline mr-2" />
                        Remove this video
                      </Label>
                    </div>
                  </div>
                )}

                {/* New Video Upload */}
                <div className="space-y-2">
                  <Label htmlFor="videoFile">
                    {formData.videoUrl && !formData.removeVideo
                      ? 'Replace Video (Optional)'
                      : 'Upload Video (Optional)'}
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="videoFile"
                      type="file"
                      accept="video/mp4,video/mov,video/avi"
                      onChange={handleVideoChange}
                      className="flex-1"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: MP4, MOV, AVI (Max file size: 100MB)
                  </p>
                </div>

                {/* Video Preview */}
                {videoPreview && (
                  <div className="space-y-2">
                    <Label>New Video Preview</Label>
                    <video controls className="w-full max-h-64 rounded-lg" src={videoPreview}>
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Current Images</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {existingImages.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt={`Announcement image ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="removeImages"
                        checked={formData.removeImages}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, removeImages: checked as boolean })
                        }
                      />
                      <Label htmlFor="removeImages" className="cursor-pointer">
                        <Trash2 className="h-4 w-4 inline mr-2" />
                        Remove all images
                      </Label>
                    </div>
                  </div>
                )}

                {/* New Images Upload */}
                <div className="space-y-2">
                  <Label htmlFor="imageFiles">Add Images (Optional)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="imageFiles"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesChange}
                      className="flex-1"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Up to 6 images, each max 10MB</p>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="space-y-2">
                    <Label>New Images Preview</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {imagePreviews.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt={`New image ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Visible Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visible"
                    checked={formData.visible}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, visible: checked as boolean })
                    }
                  />
                  <Label htmlFor="visible" className="cursor-pointer">
                    Visible to users
                  </Label>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? (
                      'Saving...'
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/announcements')}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
