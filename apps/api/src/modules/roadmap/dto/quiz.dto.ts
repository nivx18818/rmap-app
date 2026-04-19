import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class QuizDto {
  @IsString()
  @MinLength(2)
  topic!: string;

  @IsInt()
  @Min(1)
  @Max(16)
  hoursPerDay!: number;

  @IsInt()
  @Min(1)
  @Max(36)
  months!: number;
}
