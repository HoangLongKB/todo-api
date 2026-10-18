import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/validation.schema';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';
import { JobsModule } from './jobs/jobs.module';
import { TodosModule } from './todos/todos.module';
import { HealthModule } from './health/health.module';
import { WebhookModule } from './webhook/webhook.module';
import { GasModule } from './gas/gas.module';

@Module({
  imports: [
    // Đọc .env, kiểm tra bằng zod. Sai là app không chạy.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Log JSON có cấu trúc. Dev thì in đẹp bằng pino-pretty.
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        // Che header nhạy cảm trước khi ghi log. Không che thì ID token / webhook secret
        // nằm nguyên trong Cloud Logging, ai đọc được log là dùng được token (còn hạn 1 giờ).
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers["x-webhook-secret"]',
            'req.headers.cookie',
          ],
          censor: '[che]',
        },
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: { ignore: (req) => req.url?.includes('/health') === true },
      },
    }),
    // Giới hạn 100 request / 60 giây mỗi IP, chống spam.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    CacheModule,
    AuthModule,
    HealthModule,
    TodosModule,
    JobsModule,
    WebhookModule,
    GasModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
