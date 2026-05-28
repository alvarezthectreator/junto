import { WebSocketServer } from 'ws';

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

export function broadcastEventUpdate(eventId) {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'event_updated',
    eventId: eventId,
    timestamp: new Date().toISOString()
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  console.log(`📢 Broadcast: event_updated ${eventId} to ${clients.size} clients`);
}

export function broadcastEventCreated(eventId) {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'event_created',
    eventId: eventId,
    timestamp: new Date().toISOString()
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  console.log(`📢 Broadcast: event_created ${eventId} to ${clients.size} clients`);
}

export function broadcastEventDeleted(eventId) {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'event_deleted',
    eventId: eventId,
    timestamp: new Date().toISOString()
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  console.log(`📢 Broadcast: event_deleted ${eventId} to ${clients.size} clients`);
}
