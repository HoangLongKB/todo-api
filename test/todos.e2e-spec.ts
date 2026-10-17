import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

interface TodoBody {
  success: boolean;
  data: { id: string; title: string; done: boolean; ownerUid: string };
}
interface ListBody {
  success: boolean;
  data: { items: { id: string }[]; total: number };
}

/**
 * e2e chưa có ID token Firebase thật (cần trình duyệt đăng nhập).
 * Dùng webhook secret để đi qua guard: mọi request đều là uid 'webhook'.
 * Kiểm tra "A không đọc được của B" đã có ở unit test TodosService.
 */
describe('Todos CRUD (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  const secret = process.env.WEBHOOK_SECRET ?? '';
  let id = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('không token -> 401, secret sai -> 401, /health vẫn 200', async () => {
    expect((await request(server).get('/api/v1/todos')).status).toBe(401);
    const bad = await request(server)
      .get('/api/v1/todos')
      .set('x-webhook-secret', 'sai-roi-sai-roi-sai-roi');
    expect(bad.status).toBe(401);
    expect((await request(server).get('/api/v1/health')).status).toBe(200);
  });

  it('POST tạo todo; field lạ bị 400', async () => {
    const bad = await request(server)
      .post('/api/v1/todos')
      .set('x-webhook-secret', secret)
      .send({ title: 'x', laLung: 1 });
    expect(bad.status).toBe(400);

    const res = await request(server)
      .post('/api/v1/todos')
      .set('x-webhook-secret', secret)
      .send({ title: 'Mua sữa' });
    expect(res.status).toBe(201);
    const body = res.body as TodoBody;
    expect(body.data.ownerUid).toBe('webhook');
    id = body.data.id;
  });

  it('GET list thấy todo vừa tạo', async () => {
    const res = await request(server)
      .get('/api/v1/todos?limit=100')
      .set('x-webhook-secret', secret);
    const body = res.body as ListBody;
    expect(body.data.items.some((t) => t.id === id)).toBe(true);
  });

  it('PATCH done=true rồi DELETE', async () => {
    const upd = await request(server)
      .patch(`/api/v1/todos/${id}`)
      .set('x-webhook-secret', secret)
      .send({ done: true });
    expect((upd.body as TodoBody).data.done).toBe(true);

    const del = await request(server)
      .delete(`/api/v1/todos/${id}`)
      .set('x-webhook-secret', secret);
    expect(del.status).toBe(204);

    const list = await request(server)
      .get('/api/v1/todos?limit=100')
      .set('x-webhook-secret', secret);
    expect((list.body as ListBody).data.items.some((t) => t.id === id)).toBe(
      false,
    );
  });
});
