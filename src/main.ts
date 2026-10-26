import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { API_PREFIX, APP_VERSION, DOCS_PATH } from './config/app.config';

async function bootstrap(): Promise<void> {
  // bufferLogs: giữ log lúc khởi động cho tới khi pino sẵn sàng
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  configureApp(app);

  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(
    `todo-api v${APP_VERSION} chạy tại http://localhost:${port}/${API_PREFIX} (docs: /${DOCS_PATH})`,
  );
}

void bootstrap();
