import { NodeType } from '@repo/db/prisma/client';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

const toUppercaseString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.toUpperCase() : value;

export class TemplateNodesFilterDto {
  @IsOptional()
  @Transform(toUppercaseString)
  @IsEnum(NodeType)
  nodeType?: NodeType;
}
