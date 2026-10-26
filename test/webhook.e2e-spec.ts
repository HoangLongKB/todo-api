import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { Todo } from '../src/todos/todo.entity';

interface Accepted {
  data: { jobId: string; status: string };
}
interface JobBody {
  data: {
    status: string;
    result?: { created: number; updated: number; notFound: string[] };
  };
}
interface ListBody {
  data: { items: { id: string; title: string; done: boolean }[] };
}

const OWNER = 'e2e-gas-owner';

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

describe('Webhook + Jobs (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  const secret = process.env.WEBHOOK_SECRET ?? '';

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
    // Dọn dữ liệu test, không để rác trong DB local
    await app.get(DataSource).getRepository(Todo).delete({ ownerUid: OWNER });
    await app.close();
  });

  it('không secret -> 401 cho cả webhook và jobs/ping', async () => {
    expect((await request(server).post('/api/v1/jobs/ping')).status).toBe(401);
    expect(
      (await request(server).get(`/api/v1/webhook/todos?ownerUid=${OWNER}`))
        .status,
    ).toBe(401);
  });

  it('ping -> 200 kèm instanceId', async () => {
    const res = await request(server)
      .post('/api/v1/jobs/ping')
      .set('x-webhook-secret', secret);
    expect(res.status).toBe(200);
    expect((res.body as { data: { ok: boolean } }).data.ok).toBe(true);
  });

  it('import -> 202 + jobId; poll tới done; pull thấy todo', async () => {
    const acc = await request(server)
      .post('/api/v1/webhook/todos/import')
      .set('x-webhook-secret', secret)
      .send({
        ownerUid: OWNER,
        items: [{ title: 'Từ sheet 1' }, { title: 'Từ sheet 2', done: true }],
      });
    expect(acc.status).toBe(202);
    const { jobId } = (acc.body as Accepted).data;

    let job: JobBody['data'] | undefined;
    for (let i = 0; i < 20; i += 1) {
      const res = await request(server)
        .get(`/api/v1/jobs/${jobId}`)
        .set('x-webhook-secret', secret);
      job = (res.body as JobBody).data;
      if (job.status === 'done' || job.status === 'failed') break;
      await sleep(100);
    }
    expect(job?.status).toBe('done');
    expect(job?.result).toEqual({ created: 2, updated: 0, notFound: [] });

    const list = await request(server)
      .get(`/api/v1/webhook/todos?ownerUid=${OWNER}&limit=100`)
      .set('x-webhook-secret', secret);
    const titles = (list.body as ListBody).data.items.map((t) => t.title);
    expect(titles).toEqual(
      expect.arrayContaining(['Từ sheet 1', 'Từ sheet 2']),
    );
  });

  it('import với id lạ -> notFound, không tạo mới', async () => {
    const ghost = '00000000-0000-4000-8000-000000000000';
    const acc = await request(server)
      .post('/api/v1/webhook/todos/import')
      .set('x-webhook-secret', secret)
      .send({ ownerUid: OWNER, items: [{ id: ghost, title: 'ma' }] });
    const { jobId } = (acc.body as Accepted).data;
    await sleep(200);
    const res = await request(server)
      .get(`/api/v1/jobs/${jobId}`)
      .set('x-webhook-secret', secret);
    expect((res.body as JobBody).data.result?.notFound).toEqual([ghost]);
  });

  it('job không tồn tại -> 404; body thiếu ownerUid -> 400', async () => {
    const nf = await request(server)
      .get('/api/v1/jobs/khong-co')
      .set('x-webhook-secret', secret);
    expect(nf.status).toBe(404);
    const bad = await request(server)
      .post('/api/v1/webhook/todos/import')
      .set('x-webhook-secret', secret)
      .send({ items: [] });
    expect(bad.status).toBe(400);
  });
});
