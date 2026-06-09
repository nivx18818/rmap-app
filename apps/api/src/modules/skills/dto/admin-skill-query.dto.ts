import { RoleCategory } from '@repo/db/prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const toTrimmedString = ({ value }): unknown => (typeof value === 'string' ? value.trim() : value);

const toUppercaseString = ({ value }): unknown =>
  typeof value === 'string' ? value.toUpperCase() : value;

export class ListAdminSkillsQueryDto {
  @IsOptional()
  @Transform(toUppercaseString)
  @IsEnum(RoleCategory)
  roleCategory?: RoleCategory;

  @IsOptional()
  @Transform(toTrimmedString)
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;
}
