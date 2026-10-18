import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUid } from '../common/decorators/current-uid.decorator';
import { TodosService } from '../todos/todos.service';
import { GasClient, GasExportResult } from './gas.client';

/**
 * Người dùng (đăng nhập Firebase) bấm "Xuất ra Google Sheet" trên web.
 * API lấy todo của họ rồi GỌI SANG GAS; GAS ghi sheet và trả về trong cùng request.
 * Làm đồng bộ vì 100 dòng ghi sheet chỉ vài giây; việc lâu hơn thì chuyển sang 202 + job.
 */
@ApiTags('gas')
@ApiBearerAuth()
@Controller('gas')
export class GasController {
  constructor(
    private readonly todos: TodosService,
    private readonly gas: GasClient,
  ) {}

  @Post('export-todos')
  @HttpCode(HttpStatus.OK)
  async exportTodos(@CurrentUid() uid: string): Promise<GasExportResult> {
    const page = await this.todos.list(uid, { page: 1, limit: 100 });
    return this.gas.exportTodos({
      ownerUid: uid,
      items: page.items.map((t) => ({
        id: t.id,
        title: t.title,
        done: t.done,
      })),
    });
  }
}
