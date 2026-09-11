import { INestApplication } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { UploadFileProducer } from 'src/bullmq/queues/uploadFile/uploadFile.producer';
import { CloudinaryService } from 'src/uploads/cloudinary.service';
import { MessagesService } from 'src/modules/messages/messages.service';
import { JobUploadName } from 'src/shared/enums/jobUploadName';
import { RedisRateLimitStorage } from 'src/common/rate-limit/redis-rate-limit.storage';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import {
  assertConnectedToTestDatabase,
  createTestApp,
} from '../setup/test-app.factory';
import {
  cleanupRegisteredUsers,
  loginAs,
  registerNewUser,
} from '../fixtures/auth.fixture';

describe('Upload -> BullMQ and Redis rate-limit (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let queue: Queue;
  let redis: Redis;
  let storage: RedisRateLimitStorage;
  const createdUserIds: number[] = [];
  const createdChannelIds: number[] = [];
  const queueName = `it-upload-${randomUUID()}`;
  const tracker = `it-rate-${randomUUID()}`;
  const throttlerName = 'integration';

  beforeAll(async () => {
    const connection = {
      host: process.env.REDIS_HOST ?? '127.0.0.1',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      db: 15,
      maxRetriesPerRequest: null,
    };
    queue = new Queue(queueName, {
      connection,
      prefix: 'lifehealth-integration',
    });
    await queue.waitUntilReady();

    redis = new Redis(connection);
    await expect(redis.ping()).resolves.toBe('PONG');
    storage = new RedisRateLimitStorage({
      getClient: () => redis,
    } as unknown as RedisCacheService);

    // Only the queue itself is swapped for a disposable real BullMQ queue —
    // ownership checks and the Cloudinary call now live outside the
    // producer (uploads.controller.ts), so they run for real here except
    // for the network call itself, which is stubbed below (no real
    // Cloudinary credentials in .env.test).
    const testApp = await createTestApp({
      uploadFileProducer: new UploadFileProducer(queue),
    });
    app = testApp.app;
    dataSource = testApp.dataSource;
    await assertConnectedToTestDatabase(dataSource);

    const cloudinaryService = app.get(CloudinaryService);
    jest.spyOn(cloudinaryService, 'uploadMultipleFiles').mockResolvedValue([
      {
        secure_url: 'https://cdn.example.com/one-pixel.png',
        resource_type: 'image',
        original_filename: 'one-pixel',
        bytes: 0,
        format: 'png',
        public_id: 'uploads/one-pixel',
      },
    ] as never);
    jest
      .spyOn(cloudinaryService, 'deleteFile')
      .mockResolvedValue(undefined as never);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (createdChannelIds.length > 0) {
      await dataSource.query(
        `DELETE FROM "messages_attachments" WHERE message_id IN (SELECT id FROM "messages" WHERE channel_id = ANY($1))`,
        [createdChannelIds],
      );
      await dataSource.query('DELETE FROM "messages" WHERE channel_id = ANY($1)', [
        createdChannelIds,
      ]);
      await dataSource.query(
        'DELETE FROM "channel_members" WHERE channel_id = ANY($1)',
        [createdChannelIds],
      );
      await dataSource.query('DELETE FROM "channels" WHERE id = ANY($1)', [
        createdChannelIds,
      ]);
      createdChannelIds.length = 0;
    }
    await cleanupRegisteredUsers(dataSource, createdUserIds);
    createdUserIds.length = 0;
  });

  afterAll(async () => {
    await app.close();
    await queue.obliterate({ force: true });
    await queue.close();
    await redis.del(
      `{${tracker}:${throttlerName}}:hits`,
      `{${tracker}:${throttlerName}}:blocked`,
    );
    await redis.quit();
  });

  async function createOwnMessage(
    cookieHeader: string,
    userId: number,
    peerId: number,
  ) {
    const channelResponse = await request(app.getHttpServer())
      .post('/api/v1/channels/create')
      .set('Cookie', cookieHeader)
      .send([userId, peerId])
      .expect(201);
    const channelId = channelResponse.body.data.id as number;
    createdChannelIds.push(channelId);

    const messageResponse = await request(app.getHttpServer())
      .post('/api/v1/messages')
      .set('Cookie', cookieHeader)
      .send({
        message_type: 'regular',
        content: 'hello',
        sender_id: userId,
        channel_id: channelId,
      })
      .expect(201);
    return messageResponse.body.data.id as number;
  }

  it('accepts multipart upload, uploads to Cloudinary first, and enqueues only metadata (no raw file buffer) as a delayed BullMQ job', async () => {
    const patient = await registerNewUser(app, dataSource);
    createdUserIds.push(patient.userId);
    const peer = await registerNewUser(app, dataSource);
    createdUserIds.push(peer.userId);
    const login = await loginAs(app, patient);
    const messageId = await createOwnMessage(
      login.cookieHeader,
      patient.userId,
      peer.userId,
    );
    const cloudinaryService = app.get(CloudinaryService);
    const assertSenderSpy = jest.spyOn(
      app.get(MessagesService),
      'assertMessageSender',
    );

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    await request(app.getHttpServer())
      .post('/api/v1/uploads/messages/files')
      .set('Cookie', login.cookieHeader)
      .field('message_id', String(messageId))
      .attach('files', png, {
        filename: 'one-pixel.png',
        contentType: 'image/png',
      })
      .expect(202);

    expect(assertSenderSpy).toHaveBeenCalledWith(patient.userId, messageId);
    expect(cloudinaryService.uploadMultipleFiles).toHaveBeenCalledWith([
      expect.objectContaining({ originalname: 'one-pixel.png' }),
    ]);

    const jobs = await queue.getJobs(['delayed', 'waiting']);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].name).toBe(JobUploadName.UPLOAD_FILES_MESSAGE);
    expect(jobs[0].data).toEqual({
      messageId,
      files: [
        {
          url: 'https://cdn.example.com/one-pixel.png',
          type: 'IMAGE',
          file_name: 'one-pixel',
          file_size: 0,
          file_extension: 'png',
          public_id: 'uploads/one-pixel',
        },
      ],
    });
    // The exact regression this test guards: no raw multer fields (buffer,
    // mimetype, originalname, encoding, ...) ever reach the Redis-backed
    // queue.
    const serializedJob = JSON.stringify(jobs[0].data);
    expect(serializedJob).not.toContain('buffer');
    expect(serializedJob).not.toContain('mimetype');
    expect(serializedJob).not.toContain('originalname');
    expect(jobs[0].opts).toMatchObject({
      attempts: 3,
      delay: 2000,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnFail: false,
    });
  });

  it('rejects a file exceeding the 20MB limit before it reaches the queue', async () => {
    const patient = await registerNewUser(app, dataSource);
    createdUserIds.push(patient.userId);
    const peer = await registerNewUser(app, dataSource);
    createdUserIds.push(peer.userId);
    const login = await loginAs(app, patient);
    const messageId = await createOwnMessage(
      login.cookieHeader,
      patient.userId,
      peer.userId,
    );
    const cloudinaryService = app.get(CloudinaryService);
    const oversized = Buffer.alloc(20 * 1024 * 1024 + 1, 1);

    const response = await request(app.getHttpServer())
      .post('/api/v1/uploads/messages/files')
      .set('Cookie', login.cookieHeader)
      .field('message_id', String(messageId))
      .attach('files', oversized, {
        filename: 'too-big.png',
        contentType: 'image/png',
      });

    expect([400, 413]).toContain(response.status);
    expect(cloudinaryService.uploadMultipleFiles).not.toHaveBeenCalled();
    const jobs = await queue.getJobs(['delayed', 'waiting']);
    expect(jobs.filter((j) => j.data?.messageId === messageId)).toHaveLength(0);
  });

  it('uses Redis atomically for hit count, TTL and blocking state', async () => {
    const first = await storage.increment(
      tracker,
      60_000,
      2,
      30_000,
      throttlerName,
    );
    const second = await storage.increment(
      tracker,
      60_000,
      2,
      30_000,
      throttlerName,
    );
    const third = await storage.increment(
      tracker,
      60_000,
      2,
      30_000,
      throttlerName,
    );

    expect(first).toMatchObject({ totalHits: 1, isBlocked: false });
    expect(second).toMatchObject({ totalHits: 2, isBlocked: false });
    expect(third).toMatchObject({ totalHits: 3, isBlocked: true });
    expect(first.timeToExpire).toBeGreaterThan(0);
    expect(third.timeToBlockExpire).toBeGreaterThan(0);

    const [hits, hitTtl, blocked, blockedTtl] = await redis
      .multi()
      .get(`{${tracker}:${throttlerName}}:hits`)
      .pttl(`{${tracker}:${throttlerName}}:hits`)
      .get(`{${tracker}:${throttlerName}}:blocked`)
      .pttl(`{${tracker}:${throttlerName}}:blocked`)
      .exec()
      .then((results) => (results ?? []).map((entry) => entry[1]));
    expect(hits).toBe('3');
    expect(hitTtl).toBeGreaterThan(0);
    expect(blocked).toBe('1');
    expect(blockedTtl).toBeGreaterThan(0);
  });
});
