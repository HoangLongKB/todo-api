import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';

/** @Global: module nào cũng inject được CacheService mà không cần import lại. */
@Global()
@Module({ providers: [CacheService], exports: [CacheService] })
export class CacheModule {}
