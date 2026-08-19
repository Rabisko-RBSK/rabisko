import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { MensagemDTO } from '../api';

type Listener = (msg: MensagemDTO) => void;

const SOCKJS_URL = (process.env.EXPO_PUBLIC_API_URL ?? '') + '/wss';

let client: Client | null = null;
const listeners: Set<Listener> = new Set();

export const stompClient = {
  connect(token: string) {
    console.log('[stomp] connect() chamado. SOCKJS_URL =', SOCKJS_URL, 'token len =', token?.length);
    if (client?.active) {
      console.log('[stomp] já ativo, ignorando');
      return;
    }

    client = new Client({
      webSocketFactory: () => new SockJS(SOCKJS_URL) as any,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      debug: (msg) => console.log('[stomp debug]', msg),
      onConnect: () => {
        console.log('[stomp] CONECTADO');
        client!.subscribe('/user/queue/messages', (frame: IMessage) => {
          const msg: MensagemDTO = JSON.parse(frame.body);
          listeners.forEach((fn) => fn(msg));
        });
      },
      onStompError: (frame) => {
        console.error('[stomp] STOMP error:', frame.headers['message'], frame.body);
      },
      onWebSocketError: (e) => {
        console.error('[stomp] WS error:', e?.message ?? e);
      },
      onWebSocketClose: (e) => {
        console.warn('[stomp] WS fechou:', e?.code, e?.reason);
      },
      onDisconnect: () => {
        console.warn('[stomp] desconectou');
      },
    });

    client.activate();
  },

  disconnect() {
    if (!client) return;
    client.deactivate();
    client = null;
    listeners.clear();
  },

  publish(chatId: string, conteudo: string) {
    if (!client?.connected) {
      throw new Error('WebSocket desconectado');
    }
    client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ chatId, conteudo }),
    });
  },

  addListener(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  isConnected(): boolean {
    return !!client?.connected;
  },
};
