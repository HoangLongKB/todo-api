import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type * as admin from 'firebase-admin';
import type { RequestWithUser } from '../common/decorators/current-uid.decorator';
import { FIREBASE_ADMIN } from './firebase-admin.provider';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Guard toàn cục: chạy trước MỌI route.
 *  - route có @Public(): cho qua.
 *  - request đã được middleware webhook đánh dấu: cho qua.
 *  - còn lại: phải có Authorization: Bearer <ID token>, verify với Google.
 * verifyIdToken(token, true): tham số true = kiểm tra cả token bị thu hồi (user bị khóa).
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(FIREBASE_ADMIN) private readonly firebase: admin.app.App,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (req.isWebhook) return true;

    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Thiếu Authorization: Bearer <token>');
    }

    try {
      const decoded = await this.firebase.auth().verifyIdToken(token, true);
      req.user = { uid: decoded.uid, email: decoded.email };
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Token không hợp lệ: ${msg}`);
      throw new UnauthorizedException('Token không hợp lệ hoặc hết hạn');
    }
  }
}
