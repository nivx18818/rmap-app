import { IsDateString, IsOptional, Matches } from 'class-validator';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class ActivityQueryDto {
  @IsOptional()
  @IsDateString()
  @Matches(DATE_ONLY_PATTERN)
  from?: string;

  @IsOptional()
  @IsDateString()
  @Matches(DATE_ONLY_PATTERN)
  to?: string;
}
