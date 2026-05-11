import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsUUID, ValidateNested } from 'class-validator';

const QUIZ_OPTION_VALUES = ['A', 'B', 'C', 'D'] as const;

export class SubmitQuizAnswerDto {
  @IsUUID()
  question_id!: string;

  @IsIn(QUIZ_OPTION_VALUES)
  selected_option!: (typeof QUIZ_OPTION_VALUES)[number];
}

export class SubmitQuizDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitQuizAnswerDto)
  answers!: SubmitQuizAnswerDto[];
}
