import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { commentsApi, Comment, Reply, ApiError, UNAUTHENTICATED_MESSAGE, isUnauthenticatedStatus } from '@/lib/api';
import { MoreVertical, Edit, Save, X, CornerDownRight, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { DefaultAvatarFallback } from '@/components/DefaultAvatarFallback';

interface CommentCardProps {
  comment: Comment;
  onCommentUpdated: (comment: Comment) => void;
}

export function CommentCard({ comment, onCommentUpdated }: CommentCardProps) {
  const { user, isAuthenticated } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likingReplyId, setLikingReplyId] = useState<number | null>(null);

  const isAuthor = user?.id === comment.author.id;

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const resp = await commentsApi.update(comment.id, { content: editContent.trim() });
      // Backend returns { comment, postId }
      const updatedComment: Comment = (resp as any).comment ?? (resp as any);
      onCommentUpdated(updatedComment);
      setIsEditing(false);
      toast.success('Comment updated!');
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }

    try {
      setIsReplying(true);
      const resp = await commentsApi.createReply(comment.id, { content: replyContent.trim() });
      const newReply: Reply = resp.reply;

      onCommentUpdated({
        ...comment,
        replies: [...(comment.replies || []), newReply],
      });

      setReplyContent('');
      setShowReplyForm(false);
      toast.success('Reply added!');
    } catch (error) {
      console.error('Failed to create reply:', error);
      if (error instanceof ApiError) {
        toast.error(error.message || UNAUTHENTICATED_MESSAGE);
      } else {
        toast.error('Failed to add reply');
      }
    } finally {
      setIsReplying(false);
    }
  };

  const handleLikeComment = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to like comments');
      return;
    }
    try {
      setIsLiking(true);
      const resp = await commentsApi.like(comment.id);
      onCommentUpdated({
        ...comment,
        likes: resp.likes,
        likedByMe: resp.liked,
      });
    } catch (error) {
      console.error('Failed to like comment:', error);
      if (error instanceof ApiError) {
        const msg = isUnauthenticatedStatus(error.status)
          ? UNAUTHENTICATED_MESSAGE
          : (error.message || 'Failed to like comment');
        toast.error(msg);
      } else {
        toast.error('Failed to like comment');
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleLikeReply = async (replyId: number) => {
    if (!isAuthenticated) {
      toast.error('Please log in to like replies');
      return;
    }
    try {
      setLikingReplyId(replyId);
      const resp = await commentsApi.likeReply(replyId);
      const updatedReplies = (comment.replies || []).map((r) =>
        r.id === replyId
          ? { ...r, likes: resp.likes, likedByMe: resp.liked }
          : r,
      );
      onCommentUpdated({ ...comment, replies: updatedReplies });
    } catch (error) {
      console.error('Failed to like reply:', error);
      if (error instanceof ApiError) {
        const msg = isUnauthenticatedStatus(error.status)
          ? UNAUTHENTICATED_MESSAGE
          : (error.message || 'Failed to like reply');
        toast.error(msg);
      } else {
        toast.error('Failed to like reply');
      }
    } finally {
      setLikingReplyId(null);
    }
  };

  return (
    <Card className="gradient-mesh-card">
      <CardContent className="pt-4">
        <div className="flex gap-3">
          <Link to={`/profile/${comment.author.id}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
              <AvatarFallback className="text-xs">
                <DefaultAvatarFallback alt={comment.author.name} />
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <Link
                  to={`/profile/${comment.author.id}`}
                  className="font-semibold hover:underline text-sm"
                >
                  {comment.author.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </p>
              </div>

              {isAuthor && !isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
                />
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    <X className="mr-2 h-3 w-3" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleEdit}>
                    <Save className="mr-2 h-3 w-3" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>

                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleLikeComment}
                    disabled={isLiking || (!isAuthenticated)}
                    className={
                      `h-7 px-2 ${comment.likedByMe ? 'text-red-500' : ''}`
                    }
                    title={!isAuthenticated ? 'Log in to like comments' : undefined}
                  >
                    <Heart className={`mr-2 h-3 w-3 ${comment.likedByMe ? 'fill-current' : ''}`} />
                    {comment.likedByMe ? 'Unlike' : 'Like'} ({comment.likes ?? 0})
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm((v) => !v)}
                    className="h-7 px-2"
                  >
                    <CornerDownRight className="mr-2 h-3 w-3" />
                    Reply
                  </Button>
                </div>

                {showReplyForm && (
                  <div className="mt-2 pl-6 space-y-2">
                    {!isAuthenticated ? (
                      <p className="text-xs text-muted-foreground">
                        Please log in to reply.
                      </p>
                    ) : (
                      <>
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="min-h-[60px] resize-none text-sm"
                          disabled={isReplying}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowReplyForm(false);
                              setReplyContent('');
                            }}
                            disabled={isReplying}
                          >
                            <X className="mr-2 h-3 w-3" />
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleReply}
                            disabled={isReplying || !replyContent.trim()}
                          >
                            {isReplying ? 'Posting...' : 'Post reply'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {(comment.replies && comment.replies.length > 0) && (
                  <div className="mt-3 pl-6 space-y-2">
                    {comment.replies.map((r) => (
                      <div key={r.id} className="flex gap-2">
                        <Link to={`/profile/${r.author.id}`}>
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={r.author.avatar} alt={r.author.name} />
                            <AvatarFallback className="text-xs">
                              <DefaultAvatarFallback alt={r.author.name} />
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="flex items-baseline gap-2">
                              <Link
                                to={`/profile/${r.author.id}`}
                                className="font-semibold hover:underline text-xs"
                              >
                                {r.author.name}
                              </Link>
                              <span className="text-[11px] text-muted-foreground">
                                {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                              </span>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLikeReply(r.id)}
                              disabled={!isAuthenticated || likingReplyId === r.id}
                              className={`h-7 px-2 ${r.likedByMe ? 'text-red-500' : ''}`}
                              title={!isAuthenticated ? 'Log in to like replies' : undefined}
                            >
                              <Heart className={`mr-2 h-3 w-3 ${r.likedByMe ? 'fill-current' : ''}`} />
                              {r.likedByMe ? 'Unlike' : 'Like'} ({r.likes ?? 0})
                            </Button>
                          </div>

                          <p className="text-sm whitespace-pre-wrap">{r.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
