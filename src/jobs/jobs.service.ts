import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { hostname } from 'node:os';

/**
 * @Cron chạy TRONG MỖI INSTANCE của app. Cloud Run scale ra 2 instance là job chạy 2 lần.
 * instanceId để nhìn log là thấy chuyện đó. Cách tránh: dùng Cloud Scheduler gọi một
 * endpoint (giai đoạn 9), hoặc khóa phân tán trong Redis/DB trước khi chạy.
 */
@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  readonly instanceId = process.env.K_REVISION ?? hostname();

  @Cron(CronExpression.EVERY_MINUTE)
  tick(): void {
    this.logger.log(`tick instanceId=${this.instanceId}`);
  }
}
