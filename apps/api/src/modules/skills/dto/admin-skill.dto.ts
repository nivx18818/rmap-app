import { RoleCategory } from '@repo/db/prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
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

const estimatedHoursValidationOptions = {
  allowInfinity: false,
  allowNaN: false,
  maxDecimalPlaces: 2,
};

export class CreateSkillDto {
  @Transform(toTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @Transform(toTrimmedString)
  @IsString()
  @MaxLength(2000)
  description?: null | string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(estimatedHoursValidationOptions)
  @Min(0)
  @Max(9999.99)
  defaultEstimatedHours?: null | number;

  @Transform(toUppercaseString)
  @IsEnum(RoleCategory)
  roleCategory!: RoleCategory;
}

export class UpdateSkillDto {
  @ValidateIf(isDefined)
  @Transform(toTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @Transform(toTrimmedString)
  @IsString()
  @MaxLength(2000)
  description?: null | string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(estimatedHoursValidationOptions)
  @Min(0)
  @Max(9999.99)
  defaultEstimatedHours?: null | number;

  @ValidateIf(isDefined)
  @Transform(toUppercaseString)
  @IsEnum(RoleCategory)
  roleCategory?: RoleCategory;
}
