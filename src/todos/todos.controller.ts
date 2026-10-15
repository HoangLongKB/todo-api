import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentUid } from '../common/decorators/current-uid.decorator';
import { CreateTodoDto } from './dto/create-todo.dto';
import { ListTodosQuery } from './dto/list-todos.query';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { PagedTodos, TodosService } from './todos.service';
import { Todo } from './todo.entity';

@ApiTags('todos')
@ApiHeader({
  name: 'x-owner-uid',
  required: false,
  description: 'Tạm thời, thay bằng Firebase token ở giai đoạn 5',
})
@Controller('todos')
export class TodosController {
  constructor(private readonly todos: TodosService) {}

  @Get()
  list(
    @CurrentUid() uid: string,
    @Query() query: ListTodosQuery,
  ): Promise<PagedTodos> {
    return this.todos.list(uid, query);
  }

  @Get(':id')
  findOne(
    @CurrentUid() uid: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Todo> {
    return this.todos.findOne(uid, id);
  }

  @Post()
  create(@CurrentUid() uid: string, @Body() dto: CreateTodoDto): Promise<Todo> {
    return this.todos.create(uid, dto);
  }

  @Patch(':id')
  update(
    @CurrentUid() uid: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTodoDto,
  ): Promise<Todo> {
    return this.todos.update(uid, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUid() uid: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.todos.remove(uid, id);
  }
}
