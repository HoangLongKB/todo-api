import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

export interface RequestWithUser extends Request {
  user?: { uid: string; email?: string };
  isWebhook?: boolean;
}

/** uid của người gọi, do FirebaseAuthGuard hoặc WebhookAuthMiddleware gắn vào req.user. */
export const CurrentUid = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (!req.user) throw new UnauthorizedException('Chưa xác thực');
    return req.user.uid;
  },
);
