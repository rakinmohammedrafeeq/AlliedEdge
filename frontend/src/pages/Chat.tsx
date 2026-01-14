import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageCircle, Lock } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { DefaultAvatarFallback } from '@/components/DefaultAvatarFallback';
import { chatApi, followApi, OpenChatResponse, type ChatMessage as ApiChatMessage, type ChatRoomSummary } from '@/lib/api';
import { ChatRealtimeClient } from '@/lib/chatRealtime';

interface Message {
  id: number;
  roomId: number;
  senderUsername: string;
  senderDisplayName: string;
  content: string;
  timestamp: string;
}

interface ChatContact {
  id: number;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  /** Optional compatibility field used elsewhere in UI */
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface TargetUser {
  id: number;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  /** Optional compatibility field used elsewhere in UI */
  avatar?: string;
}

export default function Chat() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactQuery, setContactQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef<number>(0);
  const lastRoomIdRef = useRef<number | null>(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const oldestTimestampRef = useRef<string | null>(null);

  const selectedContactId = userId ? Number(userId) : null;
  const selectedContactIdSafe = selectedContactId != null && Number.isFinite(selectedContactId) ? selectedContactId : null;
  const [targetUser, setTargetUser] = useState<TargetUser | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [canMessage, setCanMessage] = useState<boolean>(false);
  const [lockedReason, setLockedReason] = useState<string | null>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const realtimeRef = useRef<ChatRealtimeClient | null>(null);
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);
  const pollRef = useRef<number | null>(null);

  // Used to ignore stale async responses when quickly switching contacts.
  const threadRequestSeqRef = useRef(0);

  // Reduce page size (pagination limit) for smoother UX.
  const PAGE_SIZE = 15;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Only auto-scroll when:
  // - switching rooms, OR
  // - new messages arrive AND the user is already near the bottom.
  useEffect(() => {
    const currentCount = messages.length;
    const roomChanged = roomId !== lastRoomIdRef.current;

    const scroller = scrollContainerRef.current;
    const nearBottom = (() => {
      if (!scroller) return true;
      const thresholdPx = 120;
      const distanceFromBottom = scroller.scrollHeight - (scroller.scrollTop + scroller.clientHeight);
      return distanceFromBottom <= thresholdPx;
    })();

    const appended = currentCount > lastMessageCountRef.current;

    if (roomChanged || (appended && nearBottom)) {
      if (scroller) {
        // More reliable than scrollIntoView when we have nested overflow containers.
        scroller.scrollTop = scroller.scrollHeight;
      } else {
        messagesEndRef.current?.scrollIntoView({
          behavior: roomChanged ? 'auto' : 'smooth',
          block: 'end',
        });
      }
    }

    lastMessageCountRef.current = currentCount;
    lastRoomIdRef.current = roomId;
  }, [messages.length, roomId]);

  useEffect(() => {
    return () => {
      // Cleanup realtime + polling when leaving page
      try {
        subRef.current?.unsubscribe();
      } catch {
        // ignore
      }
      subRef.current = null;

      if (pollRef.current != null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }

      realtimeRef.current?.disconnect();
      realtimeRef.current = null;
    };
  }, []);

  const refreshContacts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingContacts(true);
      const resp = await chatApi.list();
      const rooms = (resp.chatRooms || []) as ChatRoomSummary[];

      const next: ChatContact[] = rooms
        // Only show real conversations (at least one message exchanged)
        .filter((r) => r.lastMessageTime != null)
        .map((r) => ({
          id: Number(r.otherUserId),
          username: r.otherUserUsername || '',
          displayName: r.otherUserDisplayName,
          profileImageUrl: r.otherUserProfileImage,
          lastMessage: r.lastMessage || undefined,
          lastMessageTime: r.lastMessageTime || undefined,
          unreadCount: 0,
        }));

      // Sort most recent first
      next.sort((a, b) => {
        const ta = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const tb = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return tb - ta;
      });

      setContacts(next);
    } catch (e) {
      console.error('Failed to load conversations:', e);
      setContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [isAuthenticated]);

  // Load conversations on entry + whenever auth becomes available
  useEffect(() => {
    if (!isAuthenticated) return;
    void refreshContacts();
  }, [isAuthenticated, refreshContacts]);

  // Helper: force scroll to bottom (used for initial load / thread switches)
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const scroller = scrollContainerRef.current;
    if (!scroller) return;

    // Do it a few times to account for async layout (fonts/images) and React paint timing.
    const doScroll = () => {
      try {
        scroller.scrollTo({ top: scroller.scrollHeight, behavior });
      } catch {
        scroller.scrollTop = scroller.scrollHeight;
      }
    };

    requestAnimationFrame(() => {
      doScroll();
      requestAnimationFrame(() => {
        doScroll();
        // One last nudge after the browser has had a moment to finalize layout.
        window.setTimeout(doScroll, 0);
      });
    });
  }, []);

  // After finishing loading a thread, always snap to the bottom.
  // This covers cases where message heights change after initial render.
  useEffect(() => {
    if (isLoadingThread) return;
    if (!targetUser) return;
    // When opening a thread, we prefer auto to avoid "jump" animation.
    scrollToBottom('auto');
  }, [isLoadingThread, targetUser, roomId, scrollToBottom]);

  useEffect(() => {
    let mounted = true;
    // Bump request sequence so older in-flight calls can't update state.
    const reqId = ++threadRequestSeqRef.current;

    // Mark thread as loading immediately to avoid flashing stale锁/locked UI.
    setIsLoadingThread(true);

    // Reset thread state immediately on contact switch (prevents flicker/glitch).
    setTargetUser(null);
    setMessages([]);
    setRoomId(null);
    setCanMessage(false);
    setLockedReason(null);
    setHasMoreOlder(true);
    setIsLoadingOlder(false);
    oldestTimestampRef.current = null;

    // Also clear any draft so switching contacts doesn't carry text over.
    setMessageInput('');

    // Clear realtime + polling for the previous room.
    try {
      subRef.current?.unsubscribe();
    } catch {
      // ignore
    }
    subRef.current = null;
    if (pollRef.current != null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    realtimeRef.current?.disconnect();
    realtimeRef.current = null;

    const loadThread = async () => {
      if (!selectedContactIdSafe || !isAuthenticated) {
        setTargetUser(null);
        return;
      }

      try {
        setIsLoadingThread(true);
        const resp: OpenChatResponse = await chatApi.openWith(selectedContactIdSafe);
        if (!mounted) return;
        if (reqId !== threadRequestSeqRef.current) return;

        // Ensure left panel stays up to date.
        void refreshContacts();

        const tu = resp.targetUser;
        setTargetUser({
          id: Number(tu.id),
          username: tu.username,
          displayName: tu.displayName || tu.username,
          profileImageUrl: tu.profileImageUrl,
        });

        setCanMessage(Boolean(resp.canMessage));
        setLockedReason(!resp.canMessage ? (resp.reason || resp.message || 'Messaging is locked') : null);

        const rid = resp.chatRoom?.id != null ? Number(resp.chatRoom.id) : null;
        setRoomId(rid);

        // Reset pagination cursors
        setHasMoreOlder(true);
        oldestTimestampRef.current = null;

        // Only load the most recent page (WhatsApp style)
        if (rid && resp.canMessage) {
          const page = await chatApi.listMessages(rid, { size: PAGE_SIZE });
          if (!mounted) return;
          if (reqId !== threadRequestSeqRef.current) return;

          // backend returns newest-first
          const newestFirst = page.messages || [];
          const chron = [...newestFirst].reverse();

          const mapped = chron.map((m: ApiChatMessage, idx: number) => ({
            id: idx + 1,
            roomId: Number(m.roomId),
            senderUsername: m.senderUsername,
            senderDisplayName: m.senderDisplayName,
            content: m.content,
            timestamp: m.timestamp,
          }));
          setMessages(mapped);

          // Open the chat at the most recent message
          scrollToBottom('auto');

          const oldest = chron[0]?.timestamp;
          oldestTimestampRef.current = oldest || null;
          setHasMoreOlder(Boolean(page.hasMore) && newestFirst.length > 0);
        } else {
          // Locked or no room: show whatever backend included (usually none).
          const loadedMessages = (resp.messages || []).map((m: ApiChatMessage, idx: number) => ({
            id: idx + 1,
            roomId: Number(m.roomId),
            senderUsername: m.senderUsername,
            senderDisplayName: m.senderDisplayName,
            content: m.content,
            timestamp: m.timestamp,
          }));
          setMessages(loadedMessages);

          // If backend returned a thread, still start at the bottom
          scrollToBottom('auto');

          oldestTimestampRef.current = loadedMessages[0]?.timestamp || null;
          setHasMoreOlder(false);
        }

        // Realtime wiring only after the thread is confirmed current.
        const allowed = Boolean(resp.canMessage);
        if (allowed && rid) {
          try {
            const rt = new ChatRealtimeClient();
            realtimeRef.current = rt;
            await rt.connect();
            if (!mounted) return;
            if (reqId !== threadRequestSeqRef.current) return;

            subRef.current = rt.subscribe(rid, (msg) => {
              setMessages((prev) => {
                const key = `${msg.timestamp}|${msg.senderUsername}|${msg.content}`;
                const seen = prev.some((p) => `${p.timestamp}|${p.senderUsername}|${p.content}` === key);
                if (seen) return prev;
                return [
                  ...prev,
                  {
                    id: Date.now(),
                    roomId: msg.roomId,
                    senderUsername: msg.senderUsername,
                    senderDisplayName: msg.senderDisplayName,
                    content: msg.content,
                    timestamp: msg.timestamp,
                  },
                ];
              });
              void refreshContacts();
            });
          } catch (e) {
            console.warn('Realtime chat unavailable; falling back to polling', e);
            pollRef.current = window.setInterval(async () => {
              if (!selectedContactIdSafe) return;
              try {
                const refreshed = await chatApi.refreshThread(selectedContactIdSafe);
                if (!mounted) return;
                if (reqId !== threadRequestSeqRef.current) return;

                const next = (refreshed.messages || []).map((m: ApiChatMessage, idx: number) => ({
                  id: idx + 1,
                  roomId: Number(m.roomId),
                  senderUsername: m.senderUsername,
                  senderDisplayName: m.senderDisplayName,
                  content: m.content,
                  timestamp: m.timestamp,
                }));
                setMessages(next);
              } catch {
                // ignore
              }
            }, 3000);
          }
        }
      } catch (e) {
        console.error('Failed to open chat:', e);
        if (!mounted) return;
        if (reqId !== threadRequestSeqRef.current) return;
        setTargetUser(null);
        setMessages([]);
        setRoomId(null);
        setCanMessage(false);
        setLockedReason(null);
        setHasMoreOlder(true);
        oldestTimestampRef.current = null;
      } finally {
        if (mounted && reqId === threadRequestSeqRef.current) setIsLoadingThread(false);
      }
    };

    void loadThread();
    return () => {
      mounted = false;
    };
  }, [selectedContactIdSafe, isAuthenticated, refreshContacts, scrollToBottom]);

  const loadOlder = useCallback(async () => {
    if (!roomId) return;
    if (!canMessage) return;
    if (!hasMoreOlder) return;
    if (isLoadingOlder) return;
    const before = oldestTimestampRef.current;
    if (!before) return;

    const scroller = scrollContainerRef.current;
    const prevScrollHeight = scroller?.scrollHeight || 0;
    const prevScrollTop = scroller?.scrollTop || 0;

    try {
      setIsLoadingOlder(true);
      const page = await chatApi.listMessages(roomId, { size: PAGE_SIZE, before });
      const newestFirst = page.messages || [];
      // if none returned, we are done
      if (newestFirst.length === 0) {
        setHasMoreOlder(false);
        return;
      }

      const chron = [...newestFirst].reverse();
      const olderMapped: Message[] = chron.map((m: ApiChatMessage, idx: number) => ({
        id: Date.now() + idx,
        roomId: Number(m.roomId),
        senderUsername: m.senderUsername,
        senderDisplayName: m.senderDisplayName,
        content: m.content,
        timestamp: m.timestamp,
      }));

      setMessages((prev) => {
        const existingKeys = new Set(prev.map((p) => `${p.timestamp}|${p.senderUsername}|${p.content}`));
        const filtered = olderMapped.filter((m) => !existingKeys.has(`${m.timestamp}|${m.senderUsername}|${m.content}`));
        return [...filtered, ...prev];
      });

      oldestTimestampRef.current = chron[0]?.timestamp || before;
      setHasMoreOlder(Boolean(page.hasMore) && newestFirst.length > 0);

      // Preserve scroll position after prepending
      requestAnimationFrame(() => {
        const nextScrollHeight = scroller?.scrollHeight || 0;
        if (scroller) {
          scroller.scrollTop = prevScrollTop + (nextScrollHeight - prevScrollHeight);
        }
      });
    } catch (e) {
      console.error('Failed to load older messages:', e);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [PAGE_SIZE, canMessage, hasMoreOlder, isLoadingOlder, roomId]);

  // Trigger loadOlder when user scrolls near the top
  useEffect(() => {
    const scroller = scrollContainerRef.current;
    if (!scroller) return;

    const onScroll = () => {
      if (scroller.scrollTop <= 80) {
        void loadOlder();
      }
    };

    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', onScroll);
    };
  }, [loadOlder]);

  const handleContactClick = (contactId: number) => {
    navigate(`/chat/${contactId}`);
  };

  const handleFollowAndRetry = async () => {
    if (!selectedContactId) return;
    try {
      await followApi.follow(selectedContactId);
      const resp = await chatApi.openWith(selectedContactId);
      const tu = resp.targetUser;
      setTargetUser({
        id: Number(tu.id),
        username: tu.username,
        displayName: tu.displayName || tu.username,
        profileImageUrl: tu.profileImageUrl,
      });
      setCanMessage(Boolean(resp.canMessage));
      setLockedReason(!resp.canMessage ? (resp.reason || resp.message || 'Messaging is locked') : null);
      setRoomId(resp.chatRoom?.id != null ? Number(resp.chatRoom.id) : null);
      const loadedMessages = (resp.messages || []).map((m: ApiChatMessage, idx: number) => ({
        id: idx + 1,
        roomId: Number(m.roomId),
        senderUsername: m.senderUsername,
        senderDisplayName: m.senderDisplayName,
        content: m.content,
        timestamp: m.timestamp,
      }));
      setMessages(loadedMessages);
    } catch (e) {
      console.error('Follow failed:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canMessage || !roomId) return;

    const content = messageInput.trim();
    if (!content) return;

    setMessageInput('');

    // 1) Always persist via REST so the recipient can load it even if WS fails.
    try {
      const saved = await chatApi.send(roomId, content);
      setMessages((prev) => {
        const key = `${saved.timestamp}|${saved.senderUsername}|${saved.content}`;
        const seen = prev.some((p) => `${p.timestamp}|${p.senderUsername}|${p.content}` === key);
        if (seen) return prev;
        return [
          ...prev,
          {
            id: Date.now(),
            roomId: Number(saved.roomId),
            senderUsername: saved.senderUsername,
            senderDisplayName: saved.senderDisplayName,
            content: saved.content,
            timestamp: saved.timestamp,
          },
        ];
      });

      // Update conversation list (so left panel shows latest preview and ordering)
      void refreshContacts();

      // IMPORTANT: don't also send over WS on success.
      // The REST endpoint already broadcasts to `/topic/chat/{roomId}`.
      // Sending again would create a second DB row via the WS handler.
      return;
    } catch (err) {
      console.warn('REST send failed; falling back to realtime only', err);
    }

    // 2) If REST fails (rare), try WS send as a last resort.
    const rt = realtimeRef.current;
    if (rt) {
      try {
        rt.send(roomId, content);
        return;
      } catch (err) {
        console.warn('WebSocket send failed', err);
      }
    }

    // 3) Last resort optimistic UI so the user sees something.
    const newMessage: Message = {
      id: Date.now(),
      roomId,
      senderUsername: currentUser?.username || 'you',
      senderDisplayName: currentUser?.name || 'You',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) return '';
    return (
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ', ' +
      date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    );
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredContacts = contacts.filter((c) => {
    const q = contactQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.displayName.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Navigation />
      {/* Use the app-wide animated gradient background (same as Login). */}
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Constrain the chat layout height and prevent page growth; panes scroll internally */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-180px)] overflow-hidden">
            {/* Contacts List */}
            <div className="md:col-span-4 lg:col-span-3 min-h-0">
              <Card className="h-full flex flex-col min-h-0 gradient-mesh-card">
                <div className="p-4 border-b border-border">
                  <Input
                    value={contactQuery}
                    onChange={(e) => setContactQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full"
                    autoComplete="off"
                  />
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                  {isLoadingContacts ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>Loading conversations...</p>
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No conversations found</p>
                    </div>
                  ) : (
                    <>
                      {filteredContacts.map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => handleContactClick(contact.id)}
                          className={
                            `p-4 border-b border-border cursor-pointer transition-colors ` +
                            `hover:text-white ` +
                            `hover:bg-linear-to-r hover:from-[rgb(75,85,99)] hover:via-[rgb(55,65,81)] hover:to-[rgb(31,41,55)] ` +
                            `dark:hover:bg-linear-to-r dark:hover:from-[rgb(34,211,238)] dark:hover:via-[rgb(6,182,212)] dark:hover:to-[rgb(8,145,178)] ` +
                            `${selectedContactId === contact.id ? 'bg-muted' : ''}`
                          }
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={contact.avatar || contact.profileImageUrl} />
                              <AvatarFallback>
                                <DefaultAvatarFallback alt={contact.displayName} />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-sm truncate">{contact.displayName}</h3>
                                {contact.lastMessageTime ? (
                                  <span className="text-xs text-muted-foreground">
                                    {formatLastMessageTime(contact.lastMessageTime)}
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground truncate">
                                  {contact.lastMessage || 'No messages yet'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-8 lg:col-span-9 min-h-0">
              {!targetUser ? (
                <Card className="h-full flex items-center justify-center gradient-mesh-card">
                  <div className="text-center text-muted-foreground p-8">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-xl font-semibold mb-2">
                      {isLoadingThread ? 'Loading conversation...' : 'Select a conversation'}
                    </h3>
                    <p>Choose a contact from the list to start chatting</p>
                  </div>
                </Card>
              ) : (
                <Card className="h-full flex flex-col min-h-0 gradient-mesh-card">
                  <div className="p-4 bg-muted/60 border-b border-border flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-border">
                      <AvatarImage src={targetUser.avatar || targetUser.profileImageUrl} />
                      <AvatarFallback>
                        <DefaultAvatarFallback alt={targetUser.displayName} />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h5 className="font-semibold text-lg">{targetUser.displayName}</h5>
                      <small className="text-muted-foreground">@{targetUser.username}</small>
                    </div>
                  </div>

                  <div
                    className="flex-1 min-h-0 overflow-y-auto no-scrollbar overscroll-contain p-4 bg-background/30"
                    ref={scrollContainerRef}
                  >
                    {isLoadingThread ? (
                      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        Loading…
                      </div>
                    ) : (
                      <>
                        <div ref={topSentinelRef} className="h-2" />
                        <div className="h-8 flex items-center justify-center text-xs text-muted-foreground">
                          {canMessage ? (
                            isLoadingOlder ? (
                              <span>Loading older messages...</span>
                            ) : hasMoreOlder ? null : (
                              <span>Start of conversation</span>
                            )
                          ) : null}
                        </div>

                        {messages.map((msg) => {
                          const cuUsername = (currentUser?.username || '').toLowerCase();
                          const cuName = (currentUser?.name || '').toLowerCase();
                          const senderUsername = (msg.senderUsername || '').toLowerCase();
                          const senderDisplayName = (msg.senderDisplayName || '').toLowerCase();
                          const targetUsername = (targetUser?.username || '').toLowerCase();
                          const targetDisplayName = (targetUser?.displayName || '').toLowerCase();

                          // In a 1:1 thread, treat messages from the opened target user as RECEIVED (left/grey).
                          // Everything else is SENT (right/green). This avoids ambiguous username/displayName mismatches.
                          const isFromTarget =
                            (targetUsername && senderUsername && senderUsername === targetUsername) ||
                            (!targetUsername && targetDisplayName && senderDisplayName && senderDisplayName === targetDisplayName);

                          // If we can't determine (rare), fall back to matching current user.
                          const isFromMe =
                            (cuUsername && senderUsername && senderUsername === cuUsername) ||
                            (!cuUsername && cuName && senderDisplayName && senderDisplayName === cuName);

                          const isSent = isFromTarget ? false : isFromMe ? true : true;

                          return (
                            <div
                              key={msg.id}
                              className={'mb-4 flex ' + (isSent ? 'justify-end' : 'justify-start')}
                            >
                              <div className="flex flex-col min-w-0 max-w-[min(80%,44rem)]">
                                <div
                                  className={
                                    'py-2.5 px-4 rounded-2xl whitespace-pre-wrap break-anywhere ' +
                                    (isSent
                                      ? 'bg-[#2e7d58] text-white rounded-br-md'
                                      : 'bg-muted/60 text-foreground rounded-bl-md')
                                  }
                                >
                                  {msg.content}
                                </div>
                                <div
                                  className={
                                    'text-[11px] mt-1 text-muted-foreground ' +
                                    (isSent ? 'text-right' : 'text-left')
                                  }
                                >
                                  {formatTime(msg.timestamp)}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <div ref={messagesEndRef} />

                        {!canMessage ? (
                          <div className="mt-6">
                            <Card className="border border-dashed">
                              <div className="p-6 text-center">
                                <div className="mx-auto mb-3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                                  <Lock className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <h4 className="text-lg font-semibold mb-1">Messaging is locked</h4>
                                <p className="text-sm text-muted-foreground mb-4 break-anywhere">
                                  {lockedReason === 'FOLLOW_REQUIRED'
                                    ? 'Only people who follow each other can message.'
                                    : lockedReason || 'They need to follow you back to unlock messaging.'}
                                </p>
                                {lockedReason === 'FOLLOW_REQUIRED' ? (
                                  <Button onClick={handleFollowAndRetry}>Follow to unlock messages</Button>
                                ) : null}
                              </div>
                            </Card>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>

                  <div className="p-4 border-t border-border bg-card/60">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                      <Input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder={canMessage ? 'Type a message...' : isLoadingThread ? 'Loading…' : 'Messaging is locked'}
                        className="flex-1 rounded-full px-5"
                        autoComplete="off"
                        disabled={!canMessage || isLoadingThread}
                      />
                      <Button
                        type="submit"
                        className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
                        disabled={!canMessage || isLoadingThread}
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </form>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
