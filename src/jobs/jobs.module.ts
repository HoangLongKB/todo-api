import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobStore } from './job-store.service';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [JobsController],
  providers: [JobsService, JobStore],
  exports: [JobStore], // WebhookModule tạo job import qua đây
})
export class JobsModule {}
