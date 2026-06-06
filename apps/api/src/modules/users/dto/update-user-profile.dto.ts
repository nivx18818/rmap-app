import type { TransformFnParams } from 'class-transformer';

import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserProfileDto {
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(2, 100)
  fullName!: string;

  @IsOptional()
  @IsString()
  avatarUrl?: null | string;
}
