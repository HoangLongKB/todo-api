import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface RequestWithUser extends Request {
  user?: { uid: string };
}

/**
 * Lấy uid của người gọi. Giai đoạn 5 guard Firebase sẽ gắn req.user.
 * Trước đó, tạm đọc header x-owner-uid để test CRUD; không có thì 'anonymous'.
 */
export const CurrentUid = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    const fromHeader = req.headers['x-owner-uid'];
    const header = Array.isArray(fromHeader) ? fromHeader[0] : fromHeader;
    return req.user?.uid ?? header ?? 'anonymous';
  },
);
