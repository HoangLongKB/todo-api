import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { APP_VERSION } from '../config/app.config';

export interface HealthResponse {
  status: 'ok';
  version: string;
}

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'App còn sống, kèm version đang chạy' })
  check(): HealthResponse {
    return { status: 'ok', version: APP_VERSION };
  }
}

console.log('ci red test');
console.log(                     "ci red test"         
