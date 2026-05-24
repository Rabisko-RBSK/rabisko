import { Client, IMessage } from '@stomp/stompjs';
import { MensagemDTO } from '../api';

type Listener = (msg: MensagemDTO) => void;

const WS_URL = 'ws://192.168.15.5:8080/wss';

let client: Client | null = null;
const listeners: Set<Listener> = new Set();

export const stompClient = {
  connect(token: string) {
    if (client?.active) return;

    client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client!.subscribe('/user/queue/messages', (frame: IMessage) => {
          const msg: MensagemDTO = JSON.parse(frame.body);
          listeners.forEach((fn) => fn(msg));
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message'], frame.body);
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
