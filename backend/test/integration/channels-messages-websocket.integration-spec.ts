import { INestApplication } from '@nestjs/common';
import { AddressInfo } from 'net';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { io, Socket as ClientSocket } from 'socket.io-client';
import { DataSource } from 'typeorm';
import {
  assertConnectedToTestDatabase,
  createTestApp,
} from '../setup/test-app.factory';
import {
  cleanupRegisteredUsers,
  loginAs,
  registerNewUser,
} from '../fixtures/auth.fixture';

function once<T>(
  socket: ClientSocket,
  event: string,
  timeoutMs = 5_000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Timed out waiting for ${event}`)),
      timeoutMs,
    );
    socket.once(event, (payload: T) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });
}

describe('Channels, messages and WebSocket with PostgreSQL (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let endpoint: string;
  const createdUserIds: number[] = [];
  const createdChannelIds: number[] = [];
  let clients: ClientSocket[] = [];

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    await assertConnectedToTestDatabase(dataSource);
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address() as AddressInfo;
    endpoint = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    clients.forEach((client) => client.disconnect());
    clients = [];
    if (createdChannelIds.length > 0) {
      await dataSource.query(
        `DELETE FROM "messages_attachments"
         WHERE message_id IN (
           SELECT id FROM "messages" WHERE channel_id = ANY($1)
         )`,
        [createdChannelIds],
      );
      await dataSource.query(
        'DELETE FROM "messages" WHERE channel_id = ANY($1)',
        [createdChannelIds],
      );
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
  });

  function connect(cookieHeader: string) {
    const client = io(endpoint, {
      transports: ['websocket'],
      extraHeaders: { cookie: cookieHeader },
      auth: { appContext: 'patient' },
      forceNew: true,
      reconnection: false,
    });
    clients.push(client);
    return client;
  }

  it('creates a real channel, persists encrypted WebSocket message and returns decrypted HTTP history only to members', async () => {
    const [first, second, outsider] = await Promise.all([
      registerNewUser(app, dataSource),
      registerNewUser(app, dataSource),
      registerNewUser(app, dataSource),
    ]);
    createdUserIds.push(first.userId, second.userId, outsider.userId);
    const [firstLogin, secondLogin, outsiderLogin] = await Promise.all([
      loginAs(app, first),
      loginAs(app, second),
      loginAs(app, outsider),
    ]);

    const channelResponse = await request(app.getHttpServer())
      .post('/api/v1/channels/create')
      .set('Cookie', firstLogin.cookieHeader)
      .set('X-App-Context', firstLogin.appContext)
      .send([first.userId, second.userId])
      .expect(201);
    const channelId = channelResponse.body.data.id as number;
    createdChannelIds.push(channelId);
    expect(channelResponse.body.data.participants).toHaveLength(2);

    await request(app.getHttpServer())
      .get(`/api/v1/channels/${channelId}`)
      .set('Cookie', outsiderLogin.cookieHeader)
      .set('X-App-Context', outsiderLogin.appContext)
      .expect(400);

    const firstSocket = connect(firstLogin.cookieHeader);
    const secondSocket = connect(secondLogin.cookieHeader);
    await Promise.all([
      once(firstSocket, 'connect'),
      once(secondSocket, 'connect'),
    ]);

    const firstJoined = once<{ id: number; isSuccess: boolean }>(
      firstSocket,
      'notify:event',
    );
    const secondJoined = once<{ id: number; isSuccess: boolean }>(
      secondSocket,
      'notify:event',
    );
    firstSocket.emit('channel:join', {
      id: 1,
      data: { channel_id: channelId },
    });
    secondSocket.emit('channel:join', {
      id: 2,
      data: { channel_id: channelId },
    });
    await expect(firstJoined).resolves.toEqual({ id: 1, isSuccess: true });
    await expect(secondJoined).resolves.toEqual({ id: 2, isSuccess: true });

    const plaintext = 'Nội dung bí mật qua WebSocket';
    const received = once<{
      id: number;
      content: string;
      sender: { id: number };
      channel: { id: number };
    }>(secondSocket, 'receive:message');
    const acknowledged = once<{ id: number; isSuccess: boolean }>(
      firstSocket,
      'notify:event',
    );
    firstSocket.emit('send:message', {
      id: 3,
      data: {
        message_type: 'regular',
        content: plaintext,
        sender_id: second.userId,
        channel_id: channelId,
      },
    });

    const message = await received;
    await expect(acknowledged).resolves.toEqual({ id: 3, isSuccess: true });
    expect(message).toMatchObject({
      content: plaintext,
      sender: { id: first.userId },
      channel: { id: channelId },
    });

    const stored = await dataSource.query<
      { id: number; content: string; sender_id: number }[]
    >(
      `SELECT id, content, sender_id FROM "messages"
       WHERE channel_id = $1 ORDER BY id DESC LIMIT 1`,
      [channelId],
    );
    expect(stored[0].content).not.toBe(plaintext);
    expect(stored[0].sender_id).toBe(first.userId);

    const history = await request(app.getHttpServer())
      .get(`/api/v1/messages/${channelId}?page=1`)
      .set('Cookie', secondLogin.cookieHeader)
      .set('X-App-Context', secondLogin.appContext)
      .expect(200);
    expect(history.body.data.messages[0]).toMatchObject({
      id: stored[0].id,
      content: plaintext,
    });

    await request(app.getHttpServer())
      .get(`/api/v1/messages/${channelId}?page=1`)
      .set('Cookie', outsiderLogin.cookieHeader)
      .set('X-App-Context', outsiderLogin.appContext)
      .expect(404);
  });
});
