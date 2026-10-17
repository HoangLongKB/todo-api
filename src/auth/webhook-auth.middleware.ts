import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import type { RequestWithUser } from '../common/decorators/current-uid.decorator';

/**
 * Máy gọi máy (GAS, Cloud Scheduler) không có tài khoản Google để lấy ID token.
 * Chúng gửi header x-webhook-secret. Đúng thì đánh dấu req.isWebhook để guard bỏ qua
 * kiểm tra Firebase. SAI thì 401 ngay. Không có header thì đi tiếp như người thường.
 */
@Injectable()
export class WebhookAuthMiddleware implements NestMiddleware {
  use(req: RequestWithUser, _res: Response, next: NextFunction): void {
    const raw = req.headers['x-webhook-secret'];
    const given = Array.isArray(raw) ? raw[0] : raw;
    if (given === undefined) return next();

    const expected = process.env.WEBHOOK_SECRET ?? '';
    // So sánh thời gian cố định: tránh đoán secret bằng cách đo thời gian phản hồi
    const ok =
      expected.length > 0 &&
      given.length === expected.length &&
      timingSafeEqual(Buffer.from(given), Buffer.from(expected));
    if (!ok) throw new UnauthorizedException('Webhook secret sai');

    req.isWebhook = true;
    req.user = { uid: 'webhook' };
    next();
  }
}
