import { Module } from '@nestjs/common';
import { TodosModule } from '../todos/todos.module';
import { GasClient } from './gas.client';
import { GasController } from './gas.controller';

@Module({
  imports: [TodosModule],
  controllers: [GasController],
  providers: [GasClient],
})
export class GasModule {}
