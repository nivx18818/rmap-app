import { NodeStatus } from '@repo/db/prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';

const toUppercaseString = ({ value }): unknown =>
  typeof value === 'string' ? value.toUpperCase() : value;

export class UpdateNodeProgressDto {
  @Transform(toUppercaseString)
  @IsEnum(NodeStatus)
  status!: NodeStatus;
}
