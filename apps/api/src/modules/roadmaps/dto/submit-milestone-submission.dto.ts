import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

const trimString = ({ value }): unknown => (typeof value === 'string' ? value.trim() : value);

export class SubmitMilestoneSubmissionDto {
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  repoUrl!: string;
}
