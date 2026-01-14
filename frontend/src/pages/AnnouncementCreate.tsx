import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Save, X, Info, ArrowLeft } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { announcementsApi, ApiError } from '@/lib/api';
import { toast } from 'sonner';

export default function AnnouncementCreate() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    visible: true,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ROLE_ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

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
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const bad = files.find((f) => !f.type.startsWith('image/'));
    if (bad) {
      toast.error('Please select valid image files');
      return;
    }

    // Keep it reasonable for announcements
    const maxEach = 10 * 1024 * 1024;
    const tooLarge = files.find((f) => f.size > maxEach);
    if (tooLarge) {
      toast.error('Each image must be less than 10MB');
      return;
    }

    // Limit to 6 to keep UI snappy
    const next = files.slice(0, 6);
    setImageFiles(next);
    setImagePreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await announcementsApi.create({
        title: formData.title,
        message: formData.message,
        visible: formData.visible,
        imageFiles,
        videoFile,
      });

      toast.success('Announcement created');
      navigate('/announcements');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create announcement';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/announcements');
  };

  if (user?.role !== 'ROLE_ADMIN') return null;

  return (
    <>
      <Navigation />
      <div className="min-h-screen pb-8">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="gradient-mesh-card p-8">
            <h1 className="text-3xl font-semibold mb-6 pb-4 border-b border-gray-200 flex items-center gap-3">
              <PlusCircle className="w-8 h-8 text-purple-600" />
              Create New Announcement
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-base font-semibold text-gray-700 mb-2">
                  Title *
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter announcement title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="mt-2"
                />
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message" className="text-base font-semibold text-gray-700 mb-2">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  placeholder="Enter announcement message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                  className="mt-2"
                />
              </div>

              {/* Video Upload */}
              <div>
                <Label htmlFor="videoFile" className="text-base font-semibold text-gray-700 mb-2">
                  Video (Optional)
                </Label>
                <Input
                  id="videoFile"
                  type="file"
                  accept="video/mp4,video/mov,video/avi"
                  onChange={handleVideoChange}
                  className="mt-2"
                />
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <Info className="w-4 h-4" />
                  <span>Supported formats: MP4, MOV, AVI (Max file size: 100MB)</span>
                </div>

                {/* Video Preview */}
                {videoPreview && (
                  <div className="mt-4">
                    <video
                      controls
                      src={videoPreview}
                      className="max-w-full max-h-[300px] rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>

              {/* Images Upload */}
              <div>
                <Label htmlFor="imageFiles" className="text-base font-semibold text-gray-700 mb-2">
                  Images (Optional)
                </Label>
                <Input
                  id="imageFiles"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  className="mt-2"
                />
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <Info className="w-4 h-4" />
                  <span>Up to 6 images, each max 10MB</span>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {imagePreviews.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`Announcement image ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg shadow-sm border"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Visible Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visible"
                  checked={formData.visible}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, visible: checked as boolean })
                  }
                />
                <Label htmlFor="visible" className="text-base font-medium cursor-pointer flex items-center gap-2">
                  <span className="text-lg">
                    👁️
                  </span>
                  Visible to users
                </Label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Creating…' : 'Create Announcement'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>

            <Button variant="link" onClick={handleCancel} className="mt-4 pl-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Announcements
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
