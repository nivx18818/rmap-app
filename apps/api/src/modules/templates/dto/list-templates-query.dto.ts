import { RoleCategory } from '@repo/db/prisma/client';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

const toUppercaseString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.toUpperCase() : value;

export class ListTemplatesQueryDto {
  @IsOptional()
  @Transform(toUppercaseString)
  @IsEnum(RoleCategory)
  roleCategory?: RoleCategory;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number = 20;
}
