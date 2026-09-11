import assert from "node:assert/strict";
import test from "node:test";
import { Redis } from "ioredis";
import {
  InMemoryRateLimitStore,
  RedisRateLimitStore,
} from "../../../src/middlewares/rateLimitStore.js";

test("InMemoryRateLimitStore increments independently per key (two users never share a bucket)", async () => {
  const store = new InMemoryRateLimitStore();
  assert.equal(await store.increment("user:1", 60_000), 1);
  assert.equal(await store.increment("user:1", 60_000), 2);
  assert.equal(await store.increment("user:2", 60_000), 1);
});

test("RedisRateLimitStore increments atomically and shares state across instances pointed at the same Redis (simulated replicas)", async (t) => {
  const redis = new Redis({
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: 14,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });
  redis.on("error", () => undefined);

  try {
    await redis.connect();
    await redis.ping();
  } catch {
    redis.disconnect();
    t.skip("Redis not reachable in this environment");
    return;
  }

  try {
    const key = `it-chatbot-rl-test:${Date.now()}:${Math.random()}`;
    await redis.del(key);

    // Two separate store instances sharing the same Redis connection info
    // stand in for two chatbot replicas — they must observe one combined
    // counter, not each keep their own.
    const replicaA = new RedisRateLimitStore(redis);
    const replicaB = new RedisRateLimitStore(redis);

    assert.equal(await replicaA.increment(key, 60_000), 1);
    assert.equal(await replicaB.increment(key, 60_000), 2);
    assert.equal(await replicaA.increment(key, 60_000), 3);

    const ttl = await redis.pttl(key);
    assert.ok(ttl > 0 && ttl <= 60_000);

    await redis.del(key);
  } finally {
    await redis.quit();
  }
});

test("RedisRateLimitStore keys are isolated per key (two users sharing a Redis instance never share a bucket)", async (t) => {
  const redis = new Redis({
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: 14,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });
  redis.on("error", () => undefined);

  try {
    await redis.connect();
    await redis.ping();
  } catch {
    redis.disconnect();
    t.skip("Redis not reachable in this environment");
    return;
  }

  try {
    const store = new RedisRateLimitStore(redis);
    const keyA = `it-chatbot-rl-test:userA:${Date.now()}`;
    const keyB = `it-chatbot-rl-test:userB:${Date.now()}`;
    await redis.del(keyA, keyB);

    assert.equal(await store.increment(keyA, 60_000), 1);
    assert.equal(await store.increment(keyA, 60_000), 2);
    assert.equal(await store.increment(keyB, 60_000), 1);

    await redis.del(keyA, keyB);
  } finally {
    await redis.quit();
  }
});
