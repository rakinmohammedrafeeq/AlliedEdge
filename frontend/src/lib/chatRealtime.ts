import { Client, type IMessage } from '@stomp/stompjs';

// Some builds of sockjs-client reference `global` (Node) even in the browser.
// Ensure it's defined before we dynamically import sockjs-client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _global = globalThis as any;
if (typeof _global.global === 'undefined') {
  _global.global = _global;
}

export type RealtimeChatMessage = {
  roomId: number;
  senderUsername: string;
  senderDisplayName: string;
  content: string;
  timestamp: string;
};

type SubscriptionHandle = { unsubscribe: () => void };

/**
 * Very small STOMP client wrapper for the chat page.
 *
 * Contract:
 * - Connects to backend WS endpoint: /ws/chat (SockJS)
 * - Publishes to: /app/chat.send
 * - Subscribes to: /topic/chat/{roomId}
 */
export class ChatRealtimeClient {
  private client: Client;
  private connected = false;
  private sockJsPath: string;

  constructor(sockJsPath: string = '/ws/chat') {
    this.sockJsPath = sockJsPath;
    // Defer SockJS creation until connect() so we don't crash on module import.
    this.client = new Client({
      debug: () => {
        // Keep silent in prod. Uncomment for WS debugging.
      },
      reconnectDelay: 2000,
    });

    // Avoid runtime errors if broker disconnects.
    this.client.onStompError = () => {
      this.connected = false;
    };
    this.client.onWebSocketClose = () => {
      this.connected = false;
    };
    this.client.onConnect = () => {
      this.connected = true;
    };
  }

  async connect(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('ChatRealtimeClient can only connect in the browser');
    }

    if (this.connected) return;
    if (this.client.active) return;

    // Dynamic import so sockjs-client is evaluated only when we actually connect.
    const mod = await import('sockjs-client');
    const SockJS = (mod as any).default ?? mod;
    const socket = new SockJS(this.sockJsPath);
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

  subscribe(roomId: number, onMessage: (msg: RealtimeChatMessage) => void): SubscriptionHandle {
    const sub = this.client.subscribe(`/topic/chat/${roomId}`, (frame: IMessage) => {
      try {
        const parsed = JSON.parse(frame.body) as RealtimeChatMessage;
        onMessage(parsed);
      } catch {
        // ignore invalid messages
      }
    });
    return { unsubscribe: () => sub.unsubscribe() };
  }

  send(roomId: number, content: string): void {
    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ roomId, content }),
    });
  }
}
