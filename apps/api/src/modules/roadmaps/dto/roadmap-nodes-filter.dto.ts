import { NodeStatus, NodeType } from '@repo/db/prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

const toUppercaseString = ({ value }): unknown =>
  typeof value === 'string' ? value.toUpperCase() : value;

const toTrimmedString = ({ value }): unknown => (typeof value === 'string' ? value.trim() : value);

export class RoadmapNodesFilterDto {
  @IsOptional()
  @Transform(toUppercaseString)
  @IsEnum(NodeType)
  nodeType?: NodeType;

  @IsOptional()
  @Transform(toUppercaseString)
  @IsEnum(NodeStatus)
  status?: NodeStatus;

  @IsOptional()
  @Transform(toTrimmedString)
  @IsString()
  @MaxLength(200)
  q?: string;
}
