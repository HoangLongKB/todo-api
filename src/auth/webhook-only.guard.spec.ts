import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { WebhookOnlyGuard } from './webhook-only.guard';

function ctxWith(req: object): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('WebhookOnlyGuard', () => {
  const guard = new WebhookOnlyGuard();

  it('cho qua khi request đã được đánh dấu isWebhook', () => {
    expect(guard.canActivate(ctxWith({ isWebhook: true }))).toBe(true);
  });

  it('403 với người dùng Firebase (không phải webhook)', () => {
    expect(() => guard.canActivate(ctxWith({ user: { uid: 'u1' } }))).toThrow(
      ForbiddenException,
    );
  });
});
