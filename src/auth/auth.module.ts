import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { firebaseAdminProvider } from './firebase-admin.provider';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { WebhookAuthMiddleware } from './webhook-auth.middleware';

@Module({
  providers: [
    firebaseAdminProvider,
    { provide: APP_GUARD, useClass: FirebaseAuthGuard }, // guard toàn cục
  ],
  exports: [firebaseAdminProvider],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(WebhookAuthMiddleware).forRoutes('*path'); // middleware chạy trước guard
  }
}
