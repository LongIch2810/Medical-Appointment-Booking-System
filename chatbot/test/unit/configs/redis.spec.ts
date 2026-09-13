import assert from 'node:assert/strict';
import test from 'node:test';
import { getRedisClient } from '../../../src/configs/redis.js';

test('uses the Render REDIS_URL instead of legacy host/TLS variables', (t) => {
  const previousRedisUrl = process.env.REDIS_URL;
  const previousRedisHost = process.env.REDIS_HOST;
  const previousRedisTls = process.env.REDIS_TLS;
  t.after(() => {
    if (previousRedisUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = previousRedisUrl;
    if (previousRedisHost === undefined) delete process.env.REDIS_HOST;
    else process.env.REDIS_HOST = previousRedisHost;
    if (previousRedisTls === undefined) delete process.env.REDIS_TLS;
    else process.env.REDIS_TLS = previousRedisTls;
  });

  process.env.REDIS_URL = 'redis://red-example:6379';
  process.env.REDIS_HOST = 'legacy-host';
  process.env.REDIS_TLS = 'true';

  const client = getRedisClient();

  assert.equal(client.options.host, 'red-example');
  assert.equal(client.options.port, 6379);
  assert.equal(client.options.tls, undefined);
  client.disconnect();
});
