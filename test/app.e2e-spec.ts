import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

interface OkBody {
  success: true;
  data: { status: string; version: string };
}
interface ErrBody {
  success: false;
  error: { statusCode: number; message: string; path: string };
}

describe('App (e2e)', () => {
  let app: INestApplication;
  let server: Server;

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

  it('GET /api/v1/health -> 200 { success, data }', async () => {
    const res = await request(server).get('/api/v1/health');
    const body = res.body as OkBody;
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
  });

  it('GET /api/v1/khong-ton-tai -> 404 định dạng lỗi thống nhất', async () => {
    const res = await request(server).get('/api/v1/khong-ton-tai');
    const body = res.body as ErrBody;
    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.statusCode).toBe(404);
  });
});
