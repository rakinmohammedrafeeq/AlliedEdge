import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthContext } from '@/contexts/AuthContext';
import { commentsApi } from '@/lib/api';
import { Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError, UNAUTHENTICATED_MESSAGE } from '@/lib/api';
import { DefaultAvatarFallback } from '@/components/DefaultAvatarFallback';

interface CreateCommentCardProps {
  postId: number;
  onCommentCreated: () => void;
}

export function CreateCommentCard({ postId, onCommentCreated }: CreateCommentCardProps) {
  const { user } = useAuthContext();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      await commentsApi.create(postId, { content: content.trim() });
      onCommentCreated();
      setContent('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Failed to create comment:', error);
      if (error instanceof ApiError) {
        // Show authentication errors explicitly, otherwise show backend response text.
        toast.error(error.message || UNAUTHENTICATED_MESSAGE);
      } else {
        toast.error('Failed to add comment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="gradient-mesh-card">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback>
                <DefaultAvatarFallback alt={user?.name || 'Default profile image'} />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Write a comment..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px] resize-none border-border/50 focus:border-primary/50 bg-background/50"
                disabled={isSubmitting}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
