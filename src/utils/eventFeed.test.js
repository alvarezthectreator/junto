import test from 'node:test';
import assert from 'node:assert/strict';
import { dedupeFeedEvents } from './eventFeed.js';

test('dedupes the same event when local and backend versions have different ids', () => {
  const events = [
    {
      id: 'local-0',
      title: 'Sunset dinner',
      event_date: '2025-08-01',
      event_time: '19:00',
      location_city: 'Lagos',
      host_id: 'user-1',
    },
    {
      id: 'evt-123',
      title: 'Sunset dinner',
      event_date: '2025-08-01',
      event_time: '19:00',
      location_city: 'Lagos',
      host_id: 'user-1',
    },
  ];

  const deduped = dedupeFeedEvents(events);

  assert.equal(deduped.length, 1);
  assert.equal(deduped[0].id, 'evt-123');
});

test('filters out events deleted by id or signature', () => {
  const events = [
    {
      id: 'evt-1',
      title: 'Deleted event',
      event_date: '2025-08-01',
      event_time: '19:00',
      location_city: 'Lagos',
      host_id: 'user-1',
    },
    {
      id: 'evt-2',
      title: 'Keep me',
      event_date: '2025-08-02',
      event_time: '20:00',
      location_city: 'Lagos',
      host_id: 'user-2',
    },
  ];

  const deletedSignatures = new Set(['evt-1', 'deleted event|2025-08-01|19:00|lagos']);
  const deduped = dedupeFeedEvents(events, deletedSignatures);

  assert.equal(deduped.length, 1);
  assert.equal(deduped[0].id, 'evt-2');
});
