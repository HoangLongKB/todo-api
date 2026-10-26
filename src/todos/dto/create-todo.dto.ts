import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Khung dữ liệu đầu vào khi tạo todo. ValidationPipe kiểm tra trước khi vào service. */
export class CreateTodoDto {
  @ApiProperty({ example: 'Mua sữa', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @ApiPropertyOptional({ example: '2026-10-20T00:00:00.000Z', nullable: true })
  @IsOptional()
  @Type(() => Date) // chuỗi ISO -> Date trước khi validate
  @IsDate()
  dueDate?: Date | null;
}
