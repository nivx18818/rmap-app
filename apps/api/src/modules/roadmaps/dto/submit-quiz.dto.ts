import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

const toUppercaseString = ({ value }): unknown =>
  typeof value === 'string' ? value.toUpperCase() : value;

export class QuizAnswerDto {
  @IsUUID()
  questionId!: string;

  @Transform(toUppercaseString)
  @IsString()
  @IsIn(['A', 'B', 'C', 'D'])
  selectedOption!: string;
}

export class SubmitQuizDto {
  @IsArray()
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];
}
