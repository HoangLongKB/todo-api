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

describe('Todos CRUD (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  const uidA = `e2e-a-${Date.now()}`;
  const uidB = `e2e-b-${Date.now()}`;

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

  let id = '';

  it('POST tạo todo, field lạ bị 400', async () => {
    const bad = await request(server)
      .post('/api/v1/todos')
      .set('x-owner-uid', uidA)
      .send({ title: 'x', laLung: 1 });
    expect(bad.status).toBe(400);

    const res = await request(server)
      .post('/api/v1/todos')
      .set('x-owner-uid', uidA)
      .send({ title: 'Mua sữa' });
    expect(res.status).toBe(201);
    const body = res.body as TodoBody;
    expect(body.data.ownerUid).toBe(uidA);
    id = body.data.id;
  });

  it('GET list của A có 1, của B có 0', async () => {
    const a = await request(server)
      .get('/api/v1/todos')
      .set('x-owner-uid', uidA);
    const b = await request(server)
      .get('/api/v1/todos')
      .set('x-owner-uid', uidB);
    expect((a.body as ListBody).data.total).toBe(1);
    expect((b.body as ListBody).data.total).toBe(0);
  });

  it('B không đọc được todo của A', async () => {
    const res = await request(server)
      .get(`/api/v1/todos/${id}`)
      .set('x-owner-uid', uidB);
    expect(res.status).toBe(404);
  });

  it('PATCH done=true rồi DELETE', async () => {
    const upd = await request(server)
      .patch(`/api/v1/todos/${id}`)
      .set('x-owner-uid', uidA)
      .send({ done: true });
    expect((upd.body as TodoBody).data.done).toBe(true);

    const del = await request(server)
      .delete(`/api/v1/todos/${id}`)
      .set('x-owner-uid', uidA);
    expect(del.status).toBe(204);

    const list = await request(server)
      .get('/api/v1/todos')
      .set('x-owner-uid', uidA);
    expect((list.body as ListBody).data.total).toBe(0);
  });
});
