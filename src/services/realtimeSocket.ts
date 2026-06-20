import { appConfig } from '../config/appConfig';

function resolveWebSocketUrl() {
  const configured = appConfig.wsUrl;
  if (configured) {
    try {
      return new URL(configured).toString().replace(/\/+$/, '');
    } catch {
      // Fall through to runtime-derived fallback.
    }
  }

  if (typeof window === 'undefined') {
    return 'ws://localhost:5000';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}:5000`;
}

export type RealtimeEventType =
  | 'event_created'
  | 'event_updated'
  | 'event_deleted'
  | 'message_created'
  | 'conversation_updated'
  | 'safety_event'
  | 'moderation_event';

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  payload?: any;
  timestamp?: string;
}

export class RealtimeSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor(
    private readonly callbacks: Partial<{
      onEventCreated: (payload: any) => void;
      onEventUpdated: (payload: any) => void;
      onEventDeleted: (payload: any) => void;
      onMessageCreated: (payload: any) => void;
      onConversationUpdated: (payload: any) => void;
      onSafetyEvent: (payload: any) => void;
      onModerationEvent: (payload: any) => void;
      onConnectionOpen: () => void;
      onConnectionClose: () => void;
      onError: (error: string) => void;
    }> = {}
  ) {
    this.connect();
  }

  private connect() {
    try {
      const wsUrl = resolveWebSocketUrl();
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.callbacks.onConnectionOpen?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimeEventPayload;
          switch (data.type) {
            case 'event_created':
              this.callbacks.onEventCreated?.(data.payload);
              break;
            case 'event_updated':
              this.callbacks.onEventUpdated?.(data.payload);
              break;
            case 'event_deleted':
              this.callbacks.onEventDeleted?.(data.payload);
              break;
            case 'message_created':
              this.callbacks.onMessageCreated?.(data.payload);
              break;
            case 'conversation_updated':
              this.callbacks.onConversationUpdated?.(data.payload);
              break;
            case 'safety_event':
              this.callbacks.onSafetyEvent?.(data.payload);
              break;
            case 'moderation_event':
              this.callbacks.onModerationEvent?.(data.payload);
              break;
            default:
              break;
          }
        } catch (error) {
          console.error('Failed to parse realtime payload:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Realtime websocket error:', error);
        this.callbacks.onError?.(String(error));
      };

      this.ws.onclose = () => {
        this.callbacks.onConnectionClose?.();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create realtime websocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts += 1;
      window.setTimeout(() => this.connect(), this.reconnectDelay);
      return;
    }

    this.callbacks.onError?.('Failed to reconnect to realtime server');
  }

  public close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
