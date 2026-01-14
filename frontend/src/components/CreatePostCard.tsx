import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthContext } from '@/contexts/AuthContext';
import { postsApi, Post } from '@/lib/api';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { DefaultAvatarFallback } from '@/components/DefaultAvatarFallback';

interface CreatePostCardProps {
  onPostCreated: (post: Post) => void;
}

export function CreatePostCard({ onPostCreated }: CreatePostCardProps) {
  const { user } = useAuthContext();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      const newPost = await postsApi.create({ content: content.trim() });
      onPostCreated(newPost);
      setContent('');
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="gradient-mesh-card">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback>
                <DefaultAvatarFallback alt={user?.name || 'Default profile image'} />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none border-border/50 focus:border-primary/50 bg-background/50"
                disabled={isSubmitting}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="border-0 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Post
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
