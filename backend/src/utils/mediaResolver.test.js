import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMediaUrl } from './mediaResolver.js';

test('falls back to the request origin when configured upload origin is relative', () => {
  process.env.UPLOAD_PUBLIC_ORIGIN = '/api';

  const req = {
    headers: {
      host: 'app.example.com',
      'x-forwarded-proto': 'https',
    },
    secure: true,
  };

  assert.equal(
    resolveMediaUrl('/uploads/profiles/demo.mp4', req),
    'https://app.example.com/uploads/profiles/demo.mp4'
  );
});
