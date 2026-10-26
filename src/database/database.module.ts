import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...buildDataSourceOptions(),
        // Nest tự gom entity từ các module có TypeOrmModule.forFeature
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
