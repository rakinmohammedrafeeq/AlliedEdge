import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, X, Image as ImageIcon, Video, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { postsApi, ApiError, UNAUTHENTICATED_MESSAGE, isUnauthenticatedStatus } from '@/lib/api';

interface PostFormData {
  title: string;
  content: string;
  imageFiles: File[];
  imagePreviews: string[];
  videoFile: File | null;
  videoPreview: string | null;
  existingImages: string[];
  existingVideo: string | null;
  deletedExistingImageIndexes: number[];
  deleteExistingVideo: boolean;
}

export default function PostForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    imageFiles: [],
    imagePreviews: [],
    videoFile: null,
    videoPreview: null,
    existingImages: [],
    existingVideo: null,
    deletedExistingImageIndexes: [],
    deleteExistingVideo: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Load existing post data if editing
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!isEditMode || !id) return;

      try {
        setIsLoading(true);
        const post = await postsApi.getById(Number(id));
        if (cancelled) return;

        setFormData((prev) => ({
          ...prev,
          title: post.title ?? '',
          content: post.content ?? '',
          existingImages: post.imageUrls ?? [],
          existingVideo: post.videoUrl ?? null,
          deletedExistingImageIndexes: [],
          deleteExistingVideo: false,
          // clear any newly-selected files when switching to edit
          imageFiles: [],
          imagePreviews: [],
          videoFile: null,
          videoPreview: null,
        }));
      } catch (error) {
        console.error('Failed to load post for edit:', error);
        if (error instanceof ApiError) {
          const msg = isUnauthenticatedStatus(error.status)
            ? UNAUTHENTICATED_MESSAGE
            : (error.message || 'Failed to load post');
          toast.error(msg);
        } else {
          toast.error('Failed to load post');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Create preview URLs for new images
    const newPreviews = files.map((file) => URL.createObjectURL(file));

    setFormData((prev) => ({
      ...prev,
      imageFiles: [...prev.imageFiles, ...files],
      imagePreviews: [...prev.imagePreviews, ...newPreviews],
    }));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    const preview = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      // If we're editing and a post already has a video, selecting a new one
      // should replace it. Mark the existing one for deletion so the backend
      // removes it and stores the new upload.
      deleteExistingVideo: prev.existingVideo ? true : prev.deleteExistingVideo,
      videoFile: file,
      videoPreview: preview,
    }));
  };

  const handleDeleteImage = (index: number) => {
    setFormData((prev) => {
      const newImageFiles = [...prev.imageFiles];
      const newPreviews = [...prev.imagePreviews];

      // Revoke the object URL to free memory
      URL.revokeObjectURL(newPreviews[index]);

      newImageFiles.splice(index, 1);
      newPreviews.splice(index, 1);

      return {
        ...prev,
        imageFiles: newImageFiles,
        imagePreviews: newPreviews,
      };
    });
  };

  const handleDeleteExistingImage = (index: number) => {
    setFormData((prev) => {
      if (index < 0 || index >= prev.existingImages.length) return prev;
      if (prev.deletedExistingImageIndexes.includes(index)) return prev;
      return {
        ...prev,
        deletedExistingImageIndexes: [...prev.deletedExistingImageIndexes, index],
      };
    });
  };

  const handleUndoDeleteExistingImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      deletedExistingImageIndexes: prev.deletedExistingImageIndexes.filter((i) => i !== index),
    }));
  };

  const handleDeleteVideo = () => {
    if (formData.videoPreview) {
      URL.revokeObjectURL(formData.videoPreview);
    }
    setFormData((prev) => ({
      ...prev,
      videoFile: null,
      videoPreview: null,
    }));
  };

  const handleDeleteExistingVideo = () => {
    setFormData((prev) => ({
      ...prev,
      deleteExistingVideo: true,
    }));
  };

  const handleRestoreExistingVideo = () => {
    setFormData((prev) => ({
      ...prev,
      deleteExistingVideo: false,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const titleTrimmed = formData.title.trim();
    const contentTrimmed = formData.content.trim();

    if (!titleTrimmed) {
      toast.error('Please provide a title');
      setIsLoading(false);
      return;
    }

    if (titleTrimmed.length < 5 || titleTrimmed.length > 100) {
      toast.error('Title must be between 5 and 100 characters');
      setIsLoading(false);
      return;
    }

    if (!contentTrimmed) {
      toast.error('Please provide content');
      setIsLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', titleTrimmed);
      formDataToSend.append('content', contentTrimmed);

      formData.imageFiles.forEach((file) => {
        formDataToSend.append('imageFiles', file);
      });

      if (formData.videoFile) {
        formDataToSend.append('videoFile', formData.videoFile);
      }

      if (isEditMode && id) {
        // Deletions are index-based in the backend (deleteImageId list)
        formData.deletedExistingImageIndexes.forEach((idx) => {
          formDataToSend.append('deleteImageId', String(idx));
        });
        if (formData.deleteExistingVideo) {
          formDataToSend.append('deleteVideo', 'true');
        }

        await postsApi.updateMultipart(Number(id), formDataToSend);
        toast.success('Post updated successfully!');
        navigate('/myposts');
      } else {
        await postsApi.createMultipart(formDataToSend);
        toast.success('Post created successfully!');
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to save post:', error);
      if (error instanceof ApiError) {
        const msg = isUnauthenticatedStatus(error.status)
          ? UNAUTHENTICATED_MESSAGE
          : (error.message || 'Failed to save post');
        toast.error(msg);
      } else {
        toast.error('Failed to save post');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="outline" asChild className="mb-4">
            <Link to="/myposts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Posts
            </Link>
          </Button>
          <h2 className="text-3xl font-bold">
            {isEditMode ? 'Edit Post' : 'Create New Post'}
          </h2>
        </div>

        <Card className="gradient-mesh-card">
          <CardContent className="pt-6">
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
                  placeholder="Enter post title"
                  required
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">
                  Content <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your post content here..."
                  rows={12}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  You can use rich text formatting in your content.
                </p>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="images">Upload Images (Optional)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  You can select multiple images
                </p>
              </div>

              {/* Existing Images Preview */}
              {formData.existingImages.length > 0 && (
                <div className="space-y-2">
                  <Label>Existing Images</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.existingImages.map((img, index) => {
                      const marked = formData.deletedExistingImageIndexes.includes(index);
                      return (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`Existing ${index + 1}`}
                            className={`w-full h-32 object-cover rounded-lg border ${marked ? 'opacity-40 grayscale' : ''}`}
                          />
                          {marked ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="absolute top-2 right-2 opacity-100"
                              onClick={() => handleUndoDeleteExistingImage(index)}
                            >
                              Undo
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteExistingImage(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {formData.deletedExistingImageIndexes.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formData.deletedExistingImageIndexes.length} existing image(s) will be removed when you save.
                    </p>
                  )}
                </div>
              )}

              {/* New Images Preview */}
              {formData.imagePreviews.length > 0 && (
                <div className="space-y-2">
                  <Label>New Images to Upload</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteImage(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Upload */}
              <div className="space-y-2">
                <Label htmlFor="video">Upload Video (Optional)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="flex-1"
                  />
                  <Video className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              {/* Existing Video */}
              {formData.existingVideo && !formData.videoFile && (
                <div className="space-y-2">
                  <Label>Current Video</Label>
                  <div className="relative">
                    <video
                      controls
                      className={`w-full max-h-64 rounded-lg ${formData.deleteExistingVideo ? 'opacity-40' : ''}`}
                      src={formData.existingVideo}
                    >
                      Your browser does not support the video tag.
                    </video>

                    {!formData.deleteExistingVideo ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="mt-2"
                        onClick={handleDeleteExistingVideo}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Existing Video
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-2"
                        onClick={handleRestoreExistingVideo}
                      >
                        Undo remove video
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Video Preview */}
              {formData.videoPreview && (
                <div className="space-y-2">
                  <Label>Video Preview</Label>
                  <div className="relative">
                    <video
                      controls
                      className="w-full max-h-64 rounded-lg"
                      src={formData.videoPreview}
                    >
                      Your browser does not support the video tag.
                    </video>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-2"
                      onClick={handleDeleteVideo}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Video
                    </Button>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditMode ? 'Update Post' : 'Create Post'}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/myposts')}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
