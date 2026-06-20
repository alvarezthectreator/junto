import { WebSocketServer, WebSocket } from 'ws';

let wss = null;
const clients = new Set();

export function initWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('🟢 Client connected. Total:', clients.size + 1);
    clients.add(ws);

    ws.on('close', () => {
      clients.delete(ws);
      console.log('🔴 Client disconnected. Total:', clients.size);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  return wss;
}

function broadcast(type, payload) {
  if (!wss) return;

  const message = JSON.stringify({
    type,
    payload,
    timestamp: new Date().toISOString(),
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function broadcastEventUpdate(eventId) {
  broadcast('event_updated', { eventId });
  console.log(`📢 Broadcast: event_updated ${eventId} to ${clients.size} clients`);
}

export function broadcastEventCreated(eventId) {
  broadcast('event_created', { eventId });
  console.log(`📢 Broadcast: event_created ${eventId} to ${clients.size} clients`);
}

export function broadcastEventDeleted(eventId) {
  broadcast('event_deleted', { eventId });
  console.log(`📢 Broadcast: event_deleted ${eventId} to ${clients.size} clients`);
}

export function broadcastMessageCreated(message) {
  broadcast('message_created', message);
}

export function broadcastConversationUpdated(conversation) {
  broadcast('conversation_updated', conversation);
}

export function broadcastSafetyEvent(event) {
  broadcast('safety_event', event);
}

export function broadcastModerationEvent(event) {
  broadcast('moderation_event', event);
}
