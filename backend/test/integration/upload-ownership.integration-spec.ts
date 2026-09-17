import { INestApplication } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { DataSource } from 'typeorm';
import { CloudinaryService } from 'src/uploads/cloudinary.service';
import Role from 'src/entities/role.entity';
import Permission from 'src/entities/permission.entity';
import RolePermission from 'src/entities/rolePermission.entity';
import UserRole from 'src/entities/userRole.entity';
import {
  assertConnectedToTestDatabase,
  createTestApp,
} from '../setup/test-app.factory';
import {
  cleanupRegisteredUsers,
  loginAs,
  registerNewUser,
} from '../fixtures/auth.fixture';

/**
 * Chứng minh item 4: upload gắn với message/article của người khác bị chặn
 * (IDOR) qua toàn bộ pipeline HTTP thật — không chỉ ở tầng service mock.
 * Cloudinary được stub (spy trên instance thật) vì .env.test không có
 * credential Cloudinary thật; điều này không ảnh hưởng đến các case bị từ
 * chối vì ownership check chạy TRƯỚC khi Cloudinary được gọi.
 */
describe('Upload ownership (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const createdUserIds: number[] = [];
  const createdChannelIds: number[] = [];

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    await assertConnectedToTestDatabase(dataSource);

    const cloudinaryService = app.get(CloudinaryService);
    jest.spyOn(cloudinaryService, 'uploadMultipleFiles').mockResolvedValue([
      {
        secure_url: 'https://cdn.example.com/stub.png',
        resource_type: 'image',
        original_filename: 'stub',
        bytes: 1,
        format: 'png',
        public_id: 'uploads/stub',
      },
    ] as never);
    jest
      .spyOn(cloudinaryService, 'deleteFile')
      .mockResolvedValue(undefined as never);
  });

  afterEach(async () => {
    if (createdChannelIds.length > 0) {
      await dataSource.query(
        `DELETE FROM "messages_attachments" WHERE message_id IN (SELECT id FROM "messages" WHERE channel_id = ANY($1))`,
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
    await dataSource.query(
      `DELETE FROM "article_tags" WHERE article_id IN (SELECT id FROM "articles" WHERE author_id = ANY($1))`,
      [createdUserIds],
    );
    await dataSource.query('DELETE FROM "articles" WHERE author_id = ANY($1)', [
      createdUserIds,
    ]);
    await cleanupRegisteredUsers(dataSource, createdUserIds);
    createdUserIds.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects attaching a file to another user's message (cross-user IDOR)", async () => {
    const sender = await registerNewUser(app, dataSource);
    createdUserIds.push(sender.userId);
    const attacker = await registerNewUser(app, dataSource);
    createdUserIds.push(attacker.userId);
    const senderLogin = await loginAs(app, sender);
    const attackerLogin = await loginAs(app, attacker);

    const channelResponse = await request(app.getHttpServer())
      .post('/api/v1/channels/create')
      .set('Cookie', senderLogin.cookieHeader)
      .set('X-App-Context', senderLogin.appContext)
      .send([sender.userId, attacker.userId])
      .expect(201);
    const channelId = channelResponse.body.data.id as number;
    createdChannelIds.push(channelId);

    const messageResponse = await request(app.getHttpServer())
      .post('/api/v1/messages')
      .set('Cookie', senderLogin.cookieHeader)
      .set('X-App-Context', senderLogin.appContext)
      .send({
        message_type: 'regular',
        content: 'hello',
        sender_id: sender.userId,
        channel_id: channelId,
      })
      .expect(201);
    const messageId = messageResponse.body.data.id as number;

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    // The channel member who did NOT send the message tries to attach a
    // file to it.
    const attackResponse = await request(app.getHttpServer())
      .post('/api/v1/uploads/messages/files')
      .set('Cookie', attackerLogin.cookieHeader)
      .set('X-App-Context', attackerLogin.appContext)
      .field('message_id', String(messageId))
      .attach('files', png, { filename: 'x.png', contentType: 'image/png' });
    expect(attackResponse.status).toBe(403);

    // The real sender can attach a file to their own message.
    await request(app.getHttpServer())
      .post('/api/v1/uploads/messages/files')
      .set('Cookie', senderLogin.cookieHeader)
      .set('X-App-Context', senderLogin.appContext)
      .field('message_id', String(messageId))
      .attach('files', png, { filename: 'x.png', contentType: 'image/png' })
      .expect(202);
  });

  it("rejects attaching a file to another author's article when the uploader holds article:create but not article:manage (cross-author IDOR)", async () => {
    // The seeded DOCTOR role bundles article:create with article:manage
    // (content-team semantics), so it can't exercise the ownership-reject
    // branch. Build a minimal, isolated "contributor" role — additive on
    // top of the normal PATIENT role from registerNewUser — that holds only
    // article:create (no article:manage), to prove ownership still applies
    // for any account that can create articles but isn't a manager.
    const authorA = await registerNewUser(app, dataSource);
    createdUserIds.push(authorA.userId);
    const authorB = await registerNewUser(app, dataSource);
    createdUserIds.push(authorB.userId);

    const roleRepo = dataSource.getRepository(Role);
    const permissionRepo = dataSource.getRepository(Permission);
    const rolePermissionRepo = dataSource.getRepository(RolePermission);
    const userRoleRepo = dataSource.getRepository(UserRole);

    const articleCreatePermission = await permissionRepo.findOneOrFail({
      where: { name: 'article:create' },
    });
    const contributorRole = await roleRepo.save(
      roleRepo.create({
        role_name: `IT_CONTRIBUTOR_${Date.now()}`,
        description: 'Integration-test-only role: article:create, no manage',
        role_code: 900_000 + Math.floor(Math.random() * 90_000),
      }),
    );
    await rolePermissionRepo.save(
      rolePermissionRepo.create({
        role: contributorRole,
        permission: articleCreatePermission,
      }),
    );
    await userRoleRepo.save([
      userRoleRepo.create({
        user: { id: authorA.userId },
        role: contributorRole,
      }),
      userRoleRepo.create({
        user: { id: authorB.userId },
        role: contributorRole,
      }),
    ]);

    // Log in AFTER the role grant so the JWT's roles claim (and the
    // permission cache keyed by userId) reflect article:create.
    const loginA = await loginAs(app, authorA);
    const loginB = await loginAs(app, authorB);

    const topics = await dataSource.query<{ id: number }[]>(
      'SELECT id FROM "topics" LIMIT 1',
    );
    if (topics.length === 0) throw new Error('DB test không có topic nào.');

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/articles/create-article')
      .set('Cookie', loginA.cookieHeader)
      .set('X-App-Context', loginA.appContext)
      .field('title', `Integration test article ${Date.now()}`)
      .field('content', 'x'.repeat(220))
      .field('summary', 'y'.repeat(40))
      .field('tag_ids', '[]')
      .field('topic_id', String(topics[0].id))
      .attach('files', png, { filename: 'cover.png', contentType: 'image/png' })
      .expect(201);
    const articleId = createResponse.body.data.id as number;

    // Author B has article:create but not article:manage, and is not this
    // article's author — attaching a file to it must be rejected.
    const attackResponse = await request(app.getHttpServer())
      .post('/api/v1/uploads/articles/files')
      .set('Cookie', loginB.cookieHeader)
      .set('X-App-Context', loginB.appContext)
      .field('article_id', String(articleId))
      .attach('files', png, { filename: 'x.png', contentType: 'image/png' });
    expect(attackResponse.status).toBe(403);

    // The real author can attach another file to their own article.
    await request(app.getHttpServer())
      .post('/api/v1/uploads/articles/files')
      .set('Cookie', loginA.cookieHeader)
      .set('X-App-Context', loginA.appContext)
      .field('article_id', String(articleId))
      .attach('files', png, { filename: 'x.png', contentType: 'image/png' })
      .expect(202);

    await userRoleRepo.delete({ role: { id: contributorRole.id } });
    await rolePermissionRepo.delete({ role: { id: contributorRole.id } });
    await roleRepo.delete({ id: contributorRole.id });
  });
});
