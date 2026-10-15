import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todo } from './todo.entity';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Todo])], // cấp Repository<Todo> cho module này
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
