import { RoleCategory } from '@repo/db/prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const isDefined = (_object: unknown, value: unknown): boolean => value !== undefined;

const toTrimmedString = ({ value }): unknown => (typeof value === 'string' ? value.trim() : value);

const toUppercaseString = ({ value }): unknown =>
  typeof value === 'string' ? value.toUpperCase() : value;

const toNullableNumber = ({ value }): unknown => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  return Number(value);
};

export class CreateTemplateDto {
  @Transform(toTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @Transform(toUppercaseString)
  @IsEnum(RoleCategory)
  roleCategory!: RoleCategory;

  @Transform(toTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @Transform(toNullableNumber)
  @IsInt()
  @Min(1)
  @Max(520)
  estimatedWeeks?: null | number;
}

export class UpdateTemplateDto {
  @ValidateIf(isDefined)
  @Transform(toTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ValidateIf(isDefined)
  @Transform(toUppercaseString)
  @IsEnum(RoleCategory)
  roleCategory?: RoleCategory;

  @ValidateIf(isDefined)
  @Transform(toTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: string;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @Transform(toNullableNumber)
  @IsInt()
  @Min(1)
  @Max(520)
  estimatedWeeks?: null | number;
}
