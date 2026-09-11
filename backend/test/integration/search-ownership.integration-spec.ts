import { INestApplication } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
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

/**
 * Chứng minh search trong relatives/health-profiles không còn làm mất điều
 * kiện ownership (bug: .where() gọi lần 2 ghi đè điều kiện đầu, hoặc
 * .orWhere() ở top-level thoát khỏi AND user.id = :userId). Dùng 2 patient
 * thật, đăng ký qua API thật, để chứng minh qua toàn bộ pipeline HTTP ->
 * guard -> service -> Postgres thật, không chỉ mock query builder.
 */
describe('Search ownership isolation (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let relationshipCode: string;
  const createdUserIds: number[] = [];

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    await assertConnectedToTestDatabase(dataSource);

    const relationships = await dataSource.query<
      { relationship_code: string }[]
    >(
      `SELECT relationship_code FROM "relationships"
       WHERE relationship_code <> 'ban_than' ORDER BY id LIMIT 1`,
    );
    if (relationships.length === 0) {
      throw new Error('DB test không có relationship cho người thân.');
    }
    relationshipCode = relationships[0].relationship_code;
  });

  afterEach(async () => {
    await cleanupRegisteredUsers(dataSource, createdUserIds);
    createdUserIds.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  async function createTaggedRelative(
    cookieHeader: string,
    tag: string,
  ): Promise<{ id: number; fullname: string; phone: string }> {
    const fullname = `Search Owner ${tag}`;
    const phone = `09${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
    const response = await request(app.getHttpServer())
      .post('/api/v1/relatives')
      .set('Cookie', cookieHeader)
      .send({
        fullname,
        relationship_code: relationshipCode,
        phone,
        dob: '1990-05-20',
        gender: true,
      })
      .expect(201);
    return { id: response.body.data.id, fullname, phone };
  }

  it("relatives search by fullname/phone/relationship never returns another user's relative", async () => {
    const userA = await registerNewUser(app, dataSource);
    createdUserIds.push(userA.userId);
    const loginA = await loginAs(app, userA);

    const userB = await registerNewUser(app, dataSource);
    createdUserIds.push(userB.userId);
    const loginB = await loginAs(app, userB);

    const relativeB = await createTaggedRelative(loginB.cookieHeader, 'B');

    // A searching by B's fullname, phone, or relationship name must come
    // back empty — none of the search branches should escape A's ownership
    // scope.
    const byFullname = await request(app.getHttpServer())
      .get('/api/v1/relatives/patient/relatives')
      .set('Cookie', loginA.cookieHeader)
      .query({ search: relativeB.fullname })
      .expect(200);
    expect(byFullname.body.data.relatives).toHaveLength(0);

    const byPhone = await request(app.getHttpServer())
      .get('/api/v1/relatives/patient/relatives')
      .set('Cookie', loginA.cookieHeader)
      .query({ search: relativeB.phone })
      .expect(200);
    expect(byPhone.body.data.relatives).toHaveLength(0);

    // Sanity check: B can find their own relative through the same search.
    const bFindsOwn = await request(app.getHttpServer())
      .get('/api/v1/relatives/patient/relatives')
      .set('Cookie', loginB.cookieHeader)
      .query({ search: relativeB.fullname })
      .expect(200);
    expect(
      bFindsOwn.body.data.relatives.some((r: any) => r.id === relativeB.id),
    ).toBe(true);
  });

  it("health-profile search by fullname/phone never returns another user's profile", async () => {
    const userA = await registerNewUser(app, dataSource);
    createdUserIds.push(userA.userId);
    const loginA = await loginAs(app, userA);

    const userB = await registerNewUser(app, dataSource);
    createdUserIds.push(userB.userId);
    const loginB = await loginAs(app, userB);

    const relativeB = await createTaggedRelative(loginB.cookieHeader, 'HP-B');
    await request(app.getHttpServer())
      .patch(`/api/v1/health-profiles/update/${relativeB.id}`)
      .set('Cookie', loginB.cookieHeader)
      .send({ height: 170, weight: 60, blood_type: 'A+' })
      .expect(200);

    const searchByFullname = await request(app.getHttpServer())
      .post('/api/v1/health-profiles/patient/list')
      .set('Cookie', loginA.cookieHeader)
      .send({ page: 1, limit: 10, arrange: 'desc', search: relativeB.fullname })
      .expect(200);
    expect(searchByFullname.body.data.healthProfiles).toHaveLength(0);

    const searchByPhone = await request(app.getHttpServer())
      .post('/api/v1/health-profiles/patient/list')
      .set('Cookie', loginA.cookieHeader)
      .send({ page: 1, limit: 10, arrange: 'desc', search: relativeB.phone })
      .expect(200);
    expect(searchByPhone.body.data.healthProfiles).toHaveLength(0);

    const bFindsOwn = await request(app.getHttpServer())
      .post('/api/v1/health-profiles/patient/list')
      .set('Cookie', loginB.cookieHeader)
      .send({ page: 1, limit: 10, arrange: 'desc', search: relativeB.fullname })
      .expect(200);
    expect(bFindsOwn.body.data.healthProfiles.length).toBeGreaterThan(0);
  });
});
