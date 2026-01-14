import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthContext } from '@/contexts/AuthContext';
import { postsApi, ApiError, UNAUTHENTICATED_MESSAGE, isUnauthenticatedStatus, type Post } from '@/lib/api';
import { Heart, MessageCircle, MoreVertical, Edit, Trash, Save, X, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ImageCarousel } from '@/components/ImageCarousel';
import { AutoPlayMutedVideo } from '@/components/AutoPlayMutedVideo';
import { DefaultAvatarFallback } from '@/components/DefaultAvatarFallback';
import { formatCount } from '@/lib/formatCount';
import { VerifiedBadge } from '@/components/VerifiedBadge';

interface PostCardProps {
  post: Post;
  onPostUpdated: (post: Post) => void;
  onPostDeleted: (postId: number) => void;
}

export function PostCard({ post, onPostUpdated, onPostDeleted }: PostCardProps) {
  const { user, isAuthenticated } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post?.content ?? '');
  const [isLiking, setIsLiking] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();

  const authorId = post?.author?.id;
  const authorName = post?.author?.name ?? 'Unknown';
  const authorAvatar = post?.author?.avatar;

  const isAuthor = user?.id != null && authorId != null && user.id === authorId;
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const canDelete = isAuthor || isAdmin;

  const isAuthorAdmin = post?.author?.role === 'ROLE_ADMIN';

  // Keep local edit field synced when parent state updates the post.
  // This prevents stale content and avoids showing incorrect author info after an update.
  useEffect(() => {
    setEditContent(post?.content ?? '');
  }, [post?.content]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      // Handled by rendering a login link button when unauthenticated.
      return;
    }

    // Friendly UX: don't even call the API if it's your own post.
    if (isAuthor) {
      toast.info("You can't like your own post.");
      return;
    }

    try {
      setIsLiking(true);
      const updated = await postsApi.like(post.id);
      const likedByMe = (updated as unknown as { liked?: boolean }).liked;
      onPostUpdated({ ...post, likes: updated.likes, likedByMe });
    } catch (error) {
      console.error('Failed to like post:', error);
      if (error instanceof ApiError) {
        // Backend sends: "You cannot like your own post." (403)
        if (error.status === 403 && /like your own post/i.test(error.message || '')) {
          toast.info("You can't like your own post.");
          return;
        }

        const msg = isUnauthenticatedStatus(error.status)
          ? UNAUTHENTICATED_MESSAGE
          : (error.message || 'Failed to like post');
        toast.error(msg);
      } else {
        toast.error('Failed to like post');
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    try {
      const updatedPost = await postsApi.update(post.id, { content: editContent.trim() });
      // Some update responses may not include author info; preserve existing author details.
      const merged: Post = {
        ...post,
        ...updatedPost,
        author: updatedPost?.author?.id ? updatedPost.author : post.author,
        imageUrls: updatedPost?.imageUrls ?? post.imageUrls,
        videoUrl: updatedPost?.videoUrl ?? post.videoUrl,
      };
      onPostUpdated(merged);
      setIsEditing(false);
      toast.success('Post updated successfully!');
    } catch (error) {
      console.error('Failed to update post:', error);
      if (error instanceof ApiError) {
        const msg = isUnauthenticatedStatus(error.status)
          ? UNAUTHENTICATED_MESSAGE
          : (error.message || 'Failed to update post');
        toast.error(msg);
      } else {
        toast.error('Failed to update post');
      }
    }
  };

  const handleDelete = async () => {
    try {
      await postsApi.delete(post.id);
      onPostDeleted(post.id);
      toast.success('Post deleted successfully!');
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      // Fallback for environments where clipboard permission isn't granted.
      try {
        window.prompt('Copy this link:', url);
      } finally {
        toast.success('Link ready to copy');
      }
    }
  };

  return (
    <>
      <Card className="gradient-mesh-card relative">
        {/* Bottom-right views (plain text like the feed) */}
        <div className="absolute bottom-4 right-6 text-xs text-muted-foreground">
          {formatCount(post.views ?? 0)} views
        </div>

        <CardHeader>
          <div className="flex items-start justify-between">
            <Link
              to={`/profile/${authorId ?? ''}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar>
                <AvatarImage src={authorAvatar} alt={authorName} />
                <AvatarFallback>
                  <DefaultAvatarFallback alt={authorName} />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold inline-flex items-center gap-1">
                  {authorName}
                </p>
                <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <VerifiedBadge show={isAuthorAdmin} size={12} className="mr-1" title="Admin" />
                  {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ''}
                </p>
              </div>
            </Link>

            {(isAuthor || isAdmin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAuthor && (
                    <DropdownMenuItem onClick={() => navigate(`/posts/edit/${post.id}`)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Media (Cloudinary) */}
          {(post.imageUrls?.length || post.videoUrl) && (
            <div className="mb-4 space-y-3">
              {post.videoUrl && (
                <AutoPlayMutedVideo src={post.videoUrl} />
              )}

              {post.imageUrls && post.imageUrls.length > 0 && (
                <ImageCarousel imageUrls={post.imageUrls} heightClassName="h-72" />
              )}
            </div>
          )}

          {/* Title */}
          {post.title && post.title.trim() && (
            <h3 className="mb-2 text-lg font-semibold leading-snug">
              {post.title}
            </h3>
          )}

          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleEdit}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{post.content}</p>
          )
          }
        </CardContent>

        <CardFooter className="flex gap-4 pt-0">
          {isAuthenticated ? (
            <Button
              variant={post.likedByMe ? "ghost" : "outline"}
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={
                post.likedByMe
                  ? "rounded-full border border-transparent text-white bg-linear-to-r from-[rgb(75,85,99)] via-[rgb(55,65,81)] to-[rgb(31,41,55)] dark:from-[rgb(34,211,238)] dark:via-[rgb(6,182,212)] dark:to-[rgb(8,145,178)] shadow-lg brightness-110 hover:bg-linear-to-r hover:from-[rgb(75,85,99)] hover:via-[rgb(55,65,81)] hover:to-[rgb(31,41,55)] dark:hover:from-[rgb(34,211,238)] dark:hover:via-[rgb(6,182,212)] dark:hover:to-[rgb(8,145,178)] hover:brightness-110 focus-visible:ring-0"
                  : ""
              }
            >
              <Heart className={`mr-2 h-4 w-4 ${post.likedByMe ? 'fill-current' : ''}`} />
              {formatCount(post.likes)}
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/login?redirect=${encodeURIComponent(`/post/${post.id}`)}`}>
                <Heart className="mr-2 h-4 w-4" />
                {formatCount(post.likes)}
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/post/${post.id}`}>
              <MessageCircle className="mr-2 h-4 w-4" />
              {formatCount(post.commentCount ?? post.comments?.length ?? 0)}
            </Link>
          </Button>

          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
