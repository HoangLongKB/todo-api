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
    .build();
  SwaggerModule.setup(DOCS_PATH, app, SwaggerModule.createDocument(app, doc));
}
