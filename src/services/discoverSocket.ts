// Discover Feed WebSocket Service
// Handles real-time event updates

import { appConfig } from '../config/appConfig';

export class DiscoverSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private callbacks: {
    onEventUpdated?: (eventId: string) => void;
    onEventCreated?: (eventId: string) => void;
    onEventDeleted?: (eventId: string) => void;
    onConnectionOpen?: () => void;
    onConnectionClose?: () => void;
    onError?: (error: string) => void;
  } = {};

  constructor(
    onEventUpdated?: (eventId: string) => void,
    onEventCreated?: (eventId: string) => void,
    onEventDeleted?: (eventId: string) => void
  ) {
    this.callbacks = {
      onEventUpdated,
      onEventCreated,
      onEventDeleted,
    };
    this.connect();
  }

  private connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = appConfig.wsUrl || `${protocol}//${window.location.host}`;

      console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        this.callbacks.onConnectionOpen?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received:', data);

          if (data.type === 'event_updated') {
            this.callbacks.onEventUpdated?.(data.eventId);
          } else if (data.type === 'event_created') {
            this.callbacks.onEventCreated?.(data.eventId);
          } else if (data.type === 'event_deleted') {
            this.callbacks.onEventDeleted?.(data.eventId);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.callbacks.onError?.(String(error));
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.callbacks.onConnectionClose?.();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `🔄 Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms...`
      );
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      console.log('❌ Max reconnect attempts reached');
      this.callbacks.onError?.('Failed to reconnect to server');
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public close() {
    console.log('🛑 Closing WebSocket');
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
