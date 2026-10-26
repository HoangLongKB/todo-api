import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GasClient } from './gas.client';

const payload = { ownerUid: 'u1', items: [] };

type FetchInit = { body: string };

function mockFetch(
  status: number,
  body: string,
): jest.Mock<
  Promise<{ ok: boolean; status: number; text: () => Promise<string> }>,
  [string, FetchInit]
> {
  const fn = jest.fn<
    Promise<{ ok: boolean; status: number; text: () => Promise<string> }>,
    [string, FetchInit]
  >();
  fn.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body),
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe('GasClient', () => {
  const env = process.env;
  beforeEach(() => {
    process.env = {
      ...env,
      GAS_WEBAPP_URL: 'https://script.google.com/macros/s/x/exec',
      GAS_WEBAPP_SECRET: 'secret-dai-du-16-ky-tu',
    };
  });
  afterAll(() => {
    process.env = env;
  });

  it('chưa cấu hình -> 503', async () => {
    delete process.env.GAS_WEBAPP_URL;
    await expect(new GasClient().exportTodos(payload)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('gửi secret trong body, trả kết quả khi GAS ok', async () => {
    const f = mockFetch(200, JSON.stringify({ ok: true, written: 3 }));
    const res = await new GasClient().exportTodos(payload);
    expect(res.written).toBe(3);
    const init = f.mock.calls[0][1];
    expect(JSON.parse(init.body) as Record<string, unknown>).toMatchObject({
      secret: 'secret-dai-du-16-ky-tu',
      ownerUid: 'u1',
    });
  });

  it('GAS trả HTML (lỗi script) -> 502', async () => {
    mockFetch(200, '<html>Script error</html>');
    await expect(new GasClient().exportTodos(payload)).rejects.toThrow(
      BadGatewayException,
    );
  });

  it('GAS báo ok=false -> 502 kèm lý do', async () => {
    mockFetch(200, JSON.stringify({ ok: false, error: 'secret sai' }));
    await expect(new GasClient().exportTodos(payload)).rejects.toThrow(
      'secret sai',
    );
  });
});
