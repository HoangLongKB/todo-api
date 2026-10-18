import { JobStore } from './job-store.service';

const flush = (): Promise<void> =>
  new Promise((r) => setImmediate(() => setImmediate(r)));

describe('JobStore', () => {
  it('create -> pending, run xong -> done kèm result', async () => {
    const store = new JobStore();
    const job = store.create('demo');
    expect(job.status).toBe('pending');
    store.run(job, () => Promise.resolve({ n: 2 }));
    await flush();
    expect(store.get(job.id)?.status).toBe('done');
    expect(store.get(job.id)?.result).toEqual({ n: 2 });
    expect(store.get(job.id)?.finishedAt).toBeDefined();
  });

  it('fn ném lỗi -> failed kèm error, không crash', async () => {
    const store = new JobStore();
    const job = store.create('demo');
    store.run(job, () => Promise.reject(new Error('bum')));
    await flush();
    expect(store.get(job.id)?.status).toBe('failed');
    expect(store.get(job.id)?.error).toBe('bum');
  });

  it('id lạ -> undefined', () => {
    expect(new JobStore().get('khong-co')).toBeUndefined();
  });
});
