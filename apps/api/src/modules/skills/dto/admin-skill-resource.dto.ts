import { ResourceType } from '@repo/db/prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const isDefined = (_object: unknown, value: unknown): boolean => value !== undefined;

const toTrimmedString = ({ value }): unknown => (typeof value === 'string' ? value.trim() : value);

const toUppercaseString = ({ value }): unknown =>
  typeof value === 'string' ? value.toUpperCase() : value;

const urlValidationOptions = {
  protocols: ['http', 'https'],
  require_protocol: true,
};

export class CreateSkillResourceDto {
  @Transform(toTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @Transform(toTrimmedString)
  @IsUrl(urlValidationOptions)
  url!: string;

  @Transform(toUppercaseString)
  @IsEnum(ResourceType)
  resourceType!: ResourceType;

  @ValidateIf(isDefined)
  @IsBoolean()
  isFree?: boolean;

  @ValidateIf(isDefined)
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateSkillResourceDto {
  @ValidateIf(isDefined)
  @Transform(toTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ValidateIf(isDefined)
  @Transform(toTrimmedString)
  @IsUrl(urlValidationOptions)
  url?: string;

  @ValidateIf(isDefined)
  @Transform(toUppercaseString)
  @IsEnum(ResourceType)
  resourceType?: ResourceType;

  @ValidateIf(isDefined)
  @IsBoolean()
  isFree?: boolean;

  @ValidateIf(isDefined)
  @IsBoolean()
  isPrimary?: boolean;
}
