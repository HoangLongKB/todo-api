import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { WebhookOnlyGuard } from '../auth/webhook-only.guard';
import type { JobStatus } from '../jobs/job-store.service';
import { JobStore } from '../jobs/job-store.service';
import type { PagedTodos } from '../todos/todos.service';
import { TodosService } from '../todos/todos.service';
import { ImportTodosDto } from './dto/import-todos.dto';
import { ListWebhookTodosQuery } from './dto/list-webhook-todos.query';

export interface AcceptedJob {
  jobId: string;
  status: JobStatus;
  statusUrl: string;
}

/**
 * Route cho hệ thống bên ngoài (Google Apps Script) gọi bằng x-webhook-secret.
 * Tách khỏi /todos vì: không có người đăng nhập (phải truyền ownerUid),
 * và import có thể lớn nên trả 202 rồi xử lý nền.
 */
@ApiTags('webhook')
@ApiSecurity('webhook')
@UseGuards(WebhookOnlyGuard)
@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly todos: TodosService,
    private readonly store: JobStore,
  ) {}

  /** GAS pull: đọc danh sách todo của một người để ghi vào sheet. */
  @Get('todos')
  list(@Query() q: ListWebhookTodosQuery): Promise<PagedTodos> {
    return this.todos.list(q.ownerUid, q);
  }

  /**
   * GAS push: nhận cả sheet, trả 202 + jobId NGAY, xử lý nền.
   * Lý do: UrlFetchApp của GAS chỉ chờ tối đa ~60s; 500 dòng mà ghi tuần tự có thể lâu hơn.
   * Client hỏi lại GET /jobs/:id tới khi done/failed.
   */
  @Post('todos/import')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiResponse({ status: 202, description: 'Đã nhận, xử lý nền' })
  import(@Body() dto: ImportTodosDto): AcceptedJob {
    const job = this.store.create('todos.import');
    this.store.run(job, () => this.todos.importMany(dto.ownerUid, dto.items));
    return { jobId: job.id, status: job.status, statusUrl: `/jobs/${job.id}` };
  }
}
