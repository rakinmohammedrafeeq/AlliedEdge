// Smoke test for realtime post stats.
// Connects to /ws/posts via SockJS and subscribes to /topic/posts/{postId}.
// Usage (Windows cmd):
//   set POST_ID=1 && node scripts/smoke-post-realtime.mjs

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const postId = Number(process.env.POST_ID || '0');
if (!postId) {
  console.error('Set POST_ID env var to a valid post id.');
  process.exit(1);
}

const wsUrl = process.env.WS_URL || 'http://localhost:8081/ws/posts';

const client = new Client({
  reconnectDelay: 0,
  debug: (msg) => console.log('[stomp]', msg),
  webSocketFactory: () => new SockJS(wsUrl),
});

client.onConnect = () => {
  console.log('Connected. Subscribing to', `/topic/posts/${postId}`);
  client.subscribe(`/topic/posts/${postId}`, (frame) => {
    console.log('Message:', frame.body);
  });
  console.log('Waiting for messages... try liking/commenting on the post.');
};

client.onStompError = (frame) => {
  console.error('STOMP error', frame.headers['message'], frame.body);
};

client.onWebSocketError = (e) => {
  console.error('WebSocket error', e);
};

client.activate();

