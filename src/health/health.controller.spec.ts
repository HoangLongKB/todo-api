import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    controller = moduleRef.get(HealthController);
  });

  it('trả status ok và version dạng semver', () => {
    const res = controller.check();
    expect(res.status).toBe('ok');
    expect(res.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});
