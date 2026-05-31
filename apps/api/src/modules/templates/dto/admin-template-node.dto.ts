import { NodeType } from '@repo/db/prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const isDefined = (_object: unknown, value: unknown): boolean => value !== undefined;

const toNullableTrimmedString = ({ value }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const toUppercaseString = ({ value }): unknown =>
  typeof value === 'string' ? value.toUpperCase() : value;

export class CreateTemplateNodeDto {
  @IsOptional()
  @IsUUID('4')
  parentId?: null | string;

  @IsOptional()
  @IsUUID('4')
  skillId?: null | string;

  @Transform(toNullableTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @Transform(toNullableTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: null | string;

  @Transform(toUppercaseString)
  @IsEnum(NodeType)
  nodeType!: NodeType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  estimatedHours?: null | number;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  posX!: number;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  posY!: number;
}

export class UpdateTemplateNodeDto {
  @IsOptional()
  @IsUUID('4')
  parentId?: null | string;

  @IsOptional()
  @IsUUID('4')
  skillId?: null | string;

  @ValidateIf(isDefined)
  @Transform(toNullableTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @Transform(toNullableTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: null | string;

  @ValidateIf(isDefined)
  @Transform(toUppercaseString)
  @IsEnum(NodeType)
  nodeType?: NodeType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  estimatedHours?: null | number;

  @ValidateIf(isDefined)
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  posX?: number;

  @ValidateIf(isDefined)
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  posY?: number;
}
