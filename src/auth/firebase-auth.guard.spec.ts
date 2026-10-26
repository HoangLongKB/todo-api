import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FirebaseAuthGuard } from './firebase-auth.guard';

function ctxWith(
  headers: Record<string, string>,
  extra: object = {},
): ExecutionContext {
  const req = { headers, ...extra };
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('FirebaseAuthGuard', () => {
  const verifyIdToken = jest.fn();
  const firebase = { auth: () => ({ verifyIdToken }) };
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  let guard: FirebaseAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new FirebaseAuthGuard(reflector, firebase as never);
  });

  it('route @Public() thì qua không cần token', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    await expect(guard.canActivate(ctxWith({}))).resolves.toBe(true);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('không có token thì 401', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    await expect(guard.canActivate(ctxWith({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('token hợp lệ thì gắn req.user.uid', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'a@b.c' });
    const ctx = ctxWith({ authorization: 'Bearer abc' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(verifyIdToken).toHaveBeenCalledWith('abc', true);
    const req = ctx.switchToHttp().getRequest<{ user?: { uid: string } }>();
    expect(req.user?.uid).toBe('u1');
  });

  it('token giả thì 401', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    verifyIdToken.mockRejectedValue(new Error('invalid signature'));
    await expect(
      guard.canActivate(ctxWith({ authorization: 'Bearer gia' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('request webhook đã đánh dấu thì qua', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    await expect(
      guard.canActivate(
        ctxWith({}, { isWebhook: true, user: { uid: 'webhook' } }),
      ),
    ).resolves.toBe(true);
  });
});
