import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Một dòng trong sheet. Có id -> cập nhật todo đó; không id -> tạo mới. */
export class ImportTodoItemDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'Gọi khách A', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  done?: boolean;
}

/**
 * Máy gọi máy không có "người đang đăng nhập", nên phải nói rõ todo thuộc về ai.
 * ownerUid là uid Firebase của người dùng (xem Firebase console -> Authentication).
 */
export class ImportTodosDto {
  @ApiProperty({ example: 'uid-firebase-cua-leon', maxLength: 128 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  ownerUid!: string;

  @ApiProperty({ type: [ImportTodoItemDto] })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ImportTodoItemDto)
  items!: ImportTodoItemDto[];
}
