import { RoleCategory } from '@repo/db/prisma/client';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsEnum, IsUUID } from 'class-validator';

const toUppercaseString = ({ value }): unknown =>
  typeof value === 'string' ? value.toUpperCase() : value;

export class BulkSkillIdsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  ids!: string[];
}

export class BulkSkillCategoryDto extends BulkSkillIdsDto {
  @Transform(toUppercaseString)
  @IsEnum(RoleCategory)
  roleCategory!: RoleCategory;
}
