import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../config/app.config';

export interface HealthResponse {
  status: 'ok';
  version: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'App còn sống, kèm version đang chạy' })
  check(): HealthResponse {
    return { status: 'ok', version: APP_VERSION };
  }
}
