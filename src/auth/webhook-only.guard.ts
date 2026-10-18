import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { RequestWithUser } from '../common/decorators/current-uid.decorator';

/**
 * Chỉ cho máy gọi máy (đã qua WebhookAuthMiddleware với secret đúng) đi tiếp.
 * Người dùng đăng nhập Firebase hợp lệ vẫn bị 403: route webhook không dành cho họ.
 * Không có gì cả thì guard toàn cục đã trả 401 trước khi tới đây.
 */
@Injectable()
export class WebhookOnlyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (req.isWebhook) return true;
    throw new ForbiddenException('Route này chỉ dành cho x-webhook-secret');
  }
}
