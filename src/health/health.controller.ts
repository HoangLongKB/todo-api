import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { APP_VERSION } from '../config/app.config';

export interface HealthResponse {
  status: 'ok';
  version: string;
  /** Giây kể từ lúc process khởi động; reset khi Cloud Run tạo instance mới. */
  uptimeSec: number;
}

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'App còn sống, kèm version đang chạy' })
  check(): HealthResponse {
    return {
      status: 'ok',
      version: APP_VERSION,
      uptimeSec: Math.floor(process.uptime()),
    };
  }
}
