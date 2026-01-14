import { Client, type IMessage } from '@stomp/stompjs';

// Ensure `global` exists for sockjs-client (some builds reference it).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _global = globalThis as any;
if (typeof _global.global === 'undefined') {
  _global.global = _global;
}

export type RealtimePostStats = {
  postId: number;
  likes: number;
  commentCount: number;
  updatedAt?: string;
};

type SubscriptionHandle = { unsubscribe: () => void };

/**
 * Minimal STOMP client for realtime post stats.
 * - Connects to SockJS endpoint: /ws/posts
 * - Subscribes to: /topic/posts/{postId}
 */
export class PostRealtimeClient {
  private client: Client;
  private connected = false;
  private sockJsPath: string;

  constructor(sockJsPath: string = '/ws/posts') {
    this.sockJsPath = sockJsPath;
    this.client = new Client({
      reconnectDelay: 2000,
      debug: () => {
        // Keep silent by default.
      },
    });

    this.client.onStompError = (frame) => {
      this.connected = false;
      // eslint-disable-next-line no-console
      console.warn('PostRealtime STOMP error', frame.headers?.message, frame.body);
    };
    this.client.onWebSocketClose = () => {
      this.connected = false;
      // eslint-disable-next-line no-console
      console.warn('PostRealtime WS closed');
    };
    this.client.onWebSocketError = () => {
      this.connected = false;
      // eslint-disable-next-line no-console
      console.warn('PostRealtime WS error');
    };
    this.client.onConnect = () => {
      this.connected = true;
      // eslint-disable-next-line no-console
      console.info('PostRealtime connected');
    };
  }

  async connect(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.connected) return;
    if (this.client.active) return;

    const mod = await import('sockjs-client');
    const SockJS = (mod as any).default ?? mod;

    // SockJS options: ensure cookies (JSESSIONID) are sent.
    const socket = new SockJS(this.sockJsPath, undefined, {
      transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
      withCredentials: true,
    } as any);

    this.client.webSocketFactory = () => socket as any;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WebSocket connect timeout')), 8000);
      this.client.onConnect = () => {
        clearTimeout(timeout);
        this.connected = true;
        resolve();
      };
      this.client.onWebSocketError = () => {
        clearTimeout(timeout);
        this.connected = false;
        reject(new Error('WebSocket connection error'));
      };
      this.client.activate();
    });
  }

  disconnect(): void {
    try {
      this.client.deactivate();
    } finally {
      this.connected = false;
    }
  }

  subscribe(postId: number, onStats: (stats: RealtimePostStats) => void): SubscriptionHandle {
    const sub = this.client.subscribe(`/topic/posts/${postId}`, (frame: IMessage) => {
      try {
        const parsed = JSON.parse(frame.body) as RealtimePostStats;
        if (typeof parsed?.postId !== 'number') return;
        onStats(parsed);
      } catch {
        // ignore
      }
    });

    return { unsubscribe: () => sub.unsubscribe() };
  }
}
