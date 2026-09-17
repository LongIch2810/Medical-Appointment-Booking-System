import { INestApplication } from '@nestjs/common';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
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
  registerAndPromote,
  registerNewUser,
} from '../fixtures/auth.fixture';
import { ROLE_NAME } from 'src/utils/constants';

interface CapturedRequest {
  path: string;
  headers: IncomingMessage['headers'];
  body: Record<string, unknown>;
  rawBody: Buffer;
}

describe('Backend -> chatbot HTTP contract (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let chatbotServer: Server;
  let chatbotUrl: string;
  let roadmapStatus = 200;
  const captured: CapturedRequest[] = [];
  const createdUserIds: number[] = [];
  const originalChatbotUrl = process.env.CHATBOT_URL;
  const originalInternalKey = process.env.CHATBOT_INTERNAL_KEY;
  const internalKey = 'integration-contract-key';

  const respond = (
    response: ServerResponse,
    status: number,
    body: Record<string, unknown>,
  ) => {
    response.writeHead(status, { 'content-type': 'application/json' });
    response.end(JSON.stringify(body));
  };

  beforeAll(async () => {
    chatbotServer = createServer((incoming, response) => {
      const chunks: Buffer[] = [];
      incoming.on('data', (chunk: Buffer) => chunks.push(chunk));
      incoming.on('end', () => {
        const rawBody = Buffer.concat(chunks);
        const raw = rawBody.toString('utf8');
        const contentType = String(incoming.headers['content-type'] ?? '');
        const body =
          raw && contentType.includes('application/json')
            ? (JSON.parse(raw) as Record<string, unknown>)
            : {};
        const path = incoming.url ?? '';
        captured.push({ path, headers: incoming.headers, body, rawBody });

        if (path === '/chatbot/chat') {
          return respond(response, 200, { answer: 'Contract chat answer' });
        }
        if (path === '/chatbot/build-health-roadmap') {
          if (roadmapStatus !== 200) {
            return respond(response, roadmapStatus, {
              message: 'Chatbot roadmap timeout',
            });
          }
          return respond(response, 200, {
            data: { pdfUrl: 'https://cdn.test/roadmap.pdf' },
          });
        }
        if (path === '/chatbot/create-report') {
          return respond(response, 200, {
            data: {
              pdfUrl: 'https://cdn.test/report.pdf',
              raw: {
                result: JSON.stringify([{ user_count: 3 }]),
                report: null,
                chartConfig: null,
              },
            },
          });
        }
        return respond(response, 404, { message: 'Not found' });
      });
    });

    await new Promise<void>((resolve) =>
      chatbotServer.listen(0, '127.0.0.1', resolve),
    );
    const address = chatbotServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('Không lấy được cổng mock chatbot server.');
    }
    chatbotUrl = `http://127.0.0.1:${address.port}`;
    process.env.CHATBOT_URL = chatbotUrl;
    process.env.CHATBOT_INTERNAL_KEY = internalKey;

    const testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    await assertConnectedToTestDatabase(dataSource);
  });

  beforeEach(() => {
    captured.length = 0;
    roadmapStatus = 200;
  });

  afterEach(async () => {
    await cleanupRegisteredUsers(dataSource, createdUserIds);
    createdUserIds.length = 0;
  });

  afterAll(async () => {
    await app.close();
    await new Promise<void>((resolve, reject) =>
      chatbotServer.close((error) => (error ? reject(error) : resolve())),
    );
    if (originalChatbotUrl === undefined) delete process.env.CHATBOT_URL;
    else process.env.CHATBOT_URL = originalChatbotUrl;
    if (originalInternalKey === undefined)
      delete process.env.CHATBOT_INTERNAL_KEY;
    else process.env.CHATBOT_INTERNAL_KEY = originalInternalKey;
  });

  it('forwards authenticated chat fields and internal key exactly', async () => {
    const patient = await registerNewUser(app, dataSource);
    createdUserIds.push(patient.userId);
    const login = await loginAs(app, patient);

    const response = await request(app.getHttpServer())
      .post('/api/v1/chat-history/chat')
      .set('Cookie', login.cookieHeader)
      .set('X-App-Context', login.appContext)
      .send({ question: 'Tôi nên ngủ bao lâu?' })
      .expect(200);

    expect(response.body.data).toEqual({ answer: 'Contract chat answer' });
    expect(captured).toHaveLength(1);
    expect(captured[0]).toMatchObject({
      path: '/chatbot/chat',
      body: {
        question: 'Tôi nên ngủ bao lâu?',
        userId: patient.userId,
        token: login.accessToken,
      },
    });
    expect(captured[0].headers['x-chatbot-internal-key']).toBe(internalKey);
  });

  it('forwards health-roadmap contract and maps chatbot timeout to 504', async () => {
    const patient = await registerNewUser(app, dataSource);
    createdUserIds.push(patient.userId);
    const login = await loginAs(app, patient);
    const relatives = await dataSource.query<{ id: number }[]>(
      'SELECT id FROM "relatives" WHERE user_id = $1 ORDER BY id LIMIT 1',
      [patient.userId],
    );

    const success = await request(app.getHttpServer())
      .post('/api/v1/chat-history/build-health-roadmap')
      .set('Cookie', login.cookieHeader)
      .set('X-App-Context', login.appContext)
      .send({ relative_id: relatives[0].id })
      .expect(200);

    expect(success.body.data).toEqual({
      pdfUrl: 'https://cdn.test/roadmap.pdf',
    });
    expect(captured[0].body).toEqual({
      relative_id: relatives[0].id,
      token: login.accessToken,
    });

    captured.length = 0;
    roadmapStatus = 504;
    const timeout = await request(app.getHttpServer())
      .post('/api/v1/chat-history/build-health-roadmap')
      .set('Cookie', login.cookieHeader)
      .set('X-App-Context', login.appContext)
      .send({ relative_id: relatives[0].id });

    expect(timeout.status).toBe(504);
    expect(captured).toHaveLength(1);
  });

  it('forwards admin report request and maps chatbot raw rows to backend DTO', async () => {
    const admin = await registerAndPromote(app, dataSource, ROLE_NAME.ADMIN);
    createdUserIds.push(admin.userId);
    const login = await loginAs(app, admin, '/api/v1/auth/admin/login');

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin-reports/generate')
      .set('Cookie', login.cookieHeader)
      .set('X-App-Context', login.appContext)
      .send({
        reportType: 'NEW_USER_REGISTRATIONS',
        rangePreset: 'THIS_MONTH',
      })
      .expect(200);

    expect(captured[0].path).toBe('/chatbot/create-report');
    expect(captured[0].headers['x-chatbot-internal-key']).toBe(internalKey);
    expect(captured[0].body).toHaveProperty('question');
    expect(response.body.data).toMatchObject({
      reportType: 'NEW_USER_REGISTRATIONS',
      pdfUrl: 'https://cdn.test/report.pdf',
      tableRows: [{ user_count: 3 }],
    });
  });
});
