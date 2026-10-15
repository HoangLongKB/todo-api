import { PartialType } from '@nestjs/swagger';
import { CreateTodoDto } from './create-todo.dto';

/** Mọi field của Create nhưng đều optional. PATCH chỉ gửi field muốn đổi. */
export class UpdateTodoDto extends PartialType(CreateTodoDto) {}
