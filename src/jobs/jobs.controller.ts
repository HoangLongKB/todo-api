import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { WebhookOnlyGuard } from '../auth/webhook-only.guard';
import type { JobRecord } from './job-store.service';
import { JobStore } from './job-store.service';
import { JobsService } from './jobs.service';

export interface PingResult {
  ok: true;
  instanceId: string;
  at: string;
}

@ApiTags('jobs')
@ApiSecurity('webhook')
@UseGuards(WebhookOnlyGuard)
@Controller('jobs')
export class JobsController {
  private readonly logger = new Logger(JobsController.name);

  constructor(
    private readonly store: JobStore,
    private readonly jobs: JobsService,
  ) {}

  /** Client hỏi lại trạng thái job sau khi nhận 202. */
  @Get(':id')
  status(@Param('id') id: string): JobRecord {
    const job = this.store.get(id);
    if (!job) throw new NotFoundException(`Không có job ${id}`);
    return job;
  }

  /**
   * Cloud Scheduler gọi route này theo lịch (giai đoạn 2.6). Khác @Cron: dù app
   * scale ra N instance, Scheduler chỉ gọi 1 request nên job chỉ chạy 1 lần.
   */
  @Post('ping')
  @HttpCode(HttpStatus.OK)
  ping(): PingResult {
    const at = new Date().toISOString();
    this.logger.log(`ping từ scheduler instanceId=${this.jobs.instanceId}`);
    return { ok: true, instanceId: this.jobs.instanceId, at };
  }
}
