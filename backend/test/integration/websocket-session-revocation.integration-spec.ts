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

/**
 * Chứng minh WebSocket tuân thủ CÙNG chính sách thu hồi session với HTTP
 * (item 5): token đã logout-all không mở được socket mới, và một socket
 * đang mở bị từ chối event tiếp theo ngay sau khi logout-all — không cần
 * đợi client tự ngắt kết nối.
 */
describe('WebSocket session revocation (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let endpoint: string;
  const createdUserIds: number[] = [];
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
      forceNew: true,
      reconnection: false,
    });
    clients.push(client);
    return client;
  }

  it('rejects a new socket connection using a token invalidated by logout-all', async () => {
    const user = await registerNewUser(app, dataSource);
    createdUserIds.push(user.userId);
    const login = await loginAs(app, user);

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout-all')
      .set('Cookie', login.cookieHeader)
      .expect(200);

    const socket = connect(login.cookieHeader);
    const disconnected = once(socket, 'disconnect');
    const error = await once<{ code: number }>(socket, 'ws-error');
    expect(error.code).toBe(401);
    await disconnected;
  });

  it('rejects the next event on an already-open socket right after logout-all revokes the session', async () => {
    const [user, peer] = await Promise.all([
      registerNewUser(app, dataSource),
      registerNewUser(app, dataSource),
    ]);
    createdUserIds.push(user.userId, peer.userId);
    const login = await loginAs(app, user);

    const channelResponse = await request(app.getHttpServer())
      .post('/api/v1/channels/create')
      .set('Cookie', login.cookieHeader)
      .send([user.userId, peer.userId])
      .expect(201);
    const channelId = channelResponse.body.data.id as number;

    const socket = connect(login.cookieHeader);
    await once(socket, 'connect');

    // The socket connected successfully while the session was still valid;
    // confirm it works before revocation.
    const workingAck = once<{ id: number; isSuccess: boolean }>(
      socket,
      'notify:event',
    );
    socket.emit('channel:join', { id: 1, data: { channel_id: channelId } });
    await expect(workingAck).resolves.toEqual({ id: 1, isSuccess: true });

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout-all')
      .set('Cookie', login.cookieHeader)
      .expect(200);

    const rejected = once<{ code: number }>(socket, 'ws-error');
    socket.emit('channel:join', { id: 2, data: { channel_id: channelId } });
    const error = await rejected;
    expect(error.code).toBe(401);

    await dataSource.query('DELETE FROM "channel_members" WHERE channel_id = $1', [
      channelId,
    ]);
    await dataSource.query('DELETE FROM "channels" WHERE id = $1', [channelId]);
  });
});
