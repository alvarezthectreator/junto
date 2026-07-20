function normalizeFeedSignature(event) {
  const title = String(event?.title || '').trim().toLowerCase();
  const date = String(event?.event_date || '').trim();
  const time = String(event?.event_time || '').trim();
  const city = String(event?.location_city || '').trim().toLowerCase();
  const host = String(event?.host_id || '').trim().toLowerCase();

  return [host, title, date, time, city].join('|');
}

export function dedupeFeedEvents(events, deletedSignatures = new Set()) {
  const deduped = new Map();

  events.forEach((event) => {
    const id = String(event?.id || '');
    const signature = normalizeFeedSignature(event);
    const isDeleted = deletedSignatures.has(id) || deletedSignatures.has(signature);

    if (isDeleted) {
      return;
    }

    if (!deduped.has(signature)) {
      deduped.set(signature, event);
      return;
    }

    const existing = deduped.get(signature);
    const existingId = String(existing?.id || '');
    const nextId = String(event?.id || '');

    if (existingId && !nextId) {
      return;
    }

    if (!existingId && nextId) {
      deduped.set(signature, event);
      return;
    }

    if (nextId && nextId.startsWith('evt-')) {
      deduped.set(signature, event);
    }
  });

  return Array.from(deduped.values());
}
