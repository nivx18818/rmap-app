import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsUUID,
} from 'class-validator';

const toNullableString = ({ value }): unknown => (value === '' ? null : value);

export class ReorderTemplateNodesDto {
  @IsOptional()
  @Transform(toNullableString)
  @IsUUID('4')
  parentId?: null | string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  nodeIds!: string[];
}
