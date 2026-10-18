import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { API_PREFIX, APP_VERSION, DOCS_PATH } from './config/app.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

/**
 * Cấu hình dùng chung cho app thật (main.ts) và app trong test e2e,
 * để test chạy đúng cái production chạy.
 */
export function configureApp(app: INestApplication): void {
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix(API_PREFIX);
  // CORS: trình duyệt chỉ cho web ở origin khác gọi API nếu API nói "tôi cho phép origin đó".
  // Danh sách lấy từ env, local mặc định là web dev ở cổng 3000.
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim()),
    credentials: false,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // bỏ field không khai trong DTO
      forbidNonWhitelisted: true, // có field lạ thì 400, không lặng lẽ bỏ
      transform: true, // ép kiểu theo DTO (string -> number...)
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const doc = new DocumentBuilder()
    .setTitle('Todo API')
    .setDescription('API todo mô phỏng backend công ty. Dữ liệu giả.')
    .setVersion(APP_VERSION)
    .addBearerAuth()
    // Ô nhập x-webhook-secret trên Swagger để thử route webhook/jobs bằng tay
    .addApiKey(
      { type: 'apiKey', name: 'x-webhook-secret', in: 'header' },
      'webhook',
    )
    .build();
  SwaggerModule.setup(DOCS_PATH, app, SwaggerModule.createDocument(app, doc));
}
