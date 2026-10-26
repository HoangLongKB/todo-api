import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { TodosModule } from '../todos/todos.module';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [TodosModule, JobsModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
