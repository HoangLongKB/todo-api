import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ListTodosQuery } from '../../todos/dto/list-todos.query';

/** Như ListTodosQuery nhưng phải nói rõ ownerUid vì không có người đăng nhập. */
export class ListWebhookTodosQuery extends ListTodosQuery {
  @ApiProperty({ example: 'uid-firebase-cua-leon' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  ownerUid!: string;
}
