import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, ArrowLeft, Home } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { DefaultAvatarFallback } from '@/components/DefaultAvatarFallback';
import { chatApi, ChatRoomSummary } from '@/lib/api';

export default function ChatDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [chatRooms, setChatRooms] = useState<ChatRoomSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const resp = await chatApi.list();
        if (!mounted) return;
        setChatRooms(resp.chatRooms || []);
      } catch (e) {
        console.error('Failed to load chats:', e);
        if (!mounted) return;
        setChatRooms([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="gradient-mesh-card overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <MessageCircle className="h-8 w-8" />
              My Chats
            </h2>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          {/* Chat List */}
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-16 px-4">
                <p className="text-muted-foreground">Loading conversations...</p>
              </div>
            ) : chatRooms.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageCircle className="h-20 w-20 mx-auto mb-6 text-muted-foreground opacity-50" />
                <h4 className="text-xl font-semibold mb-2">No Conversations Yet</h4>
                <p className="text-muted-foreground mb-6">
                  Start following users and send them messages to begin chatting!
                </p>
                <Button asChild>
                  <Link to="/">
                    <Home className="h-4 w-4 mr-2" />
                    Explore Posts
                  </Link>
                </Button>
              </div>
            ) : (
              <div>
                {chatRooms.map((chat) => (
                  <Link
                    key={chat.id}
                    to={`/chat/${chat.otherUserId}`}
                    className="flex items-center gap-4 p-6 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <Avatar className="h-14 w-14 border-2 border-border">
                      <AvatarImage src={chat.otherUserProfileImage} />
                      <AvatarFallback>
                        <DefaultAvatarFallback alt={chat.otherUserDisplayName} />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg mb-1">
                        {chat.otherUserDisplayName}
                      </div>
                      {chat.lastMessage && (
                        <div className="text-sm text-muted-foreground truncate">
                          {chat.lastMessage}
                        </div>
                      )}
                    </div>

                    {chat.lastMessageTime && (
                      <div className="text-right text-sm text-muted-foreground flex-shrink-0">
                        <div>{format(new Date(chat.lastMessageTime), 'MMM dd')}</div>
                        <div className="text-xs">
                          {format(new Date(chat.lastMessageTime), 'hh:mm a')}
                        </div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
