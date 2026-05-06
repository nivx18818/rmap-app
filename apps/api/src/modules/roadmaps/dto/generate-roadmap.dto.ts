import { RoleCategory } from '@repo/db/prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * A single onboarding quiz answer forwarded verbatim to the AI engine.
 * Both fields are free-text — never persisted.
 */
export class AssessmentAnswerDto {
  /** The original question text returned by POST /onboarding/quiz. */
  @IsString()
  @IsNotEmpty()
  declare question: string;

  /** The option text the user selected (full text, not the letter). */
  @IsString()
  @IsNotEmpty()
  declare answer: string;
}

/**
 * Request body for POST /roadmaps/generate.
 * Submitted at the end of the onboarding flow.
 */
export class GenerateRoadmapDto {
  /** Free-text career goal written by the user. Stored in roadmaps.goal_name. */
  @IsString()
  @MinLength(10)
  @MaxLength(300)
  declare goal: string;

  /**
   * Role category inferred by the AI in POST /onboarding/quiz and echoed
   * back here so the backend can load the role skill map.
   */
  @IsEnum(RoleCategory)
  declare roleCategory: RoleCategory;

  /** Daily study hours available. */
  @IsNumber()
  @Min(0.5)
  @Max(16)
  declare hoursPerDay: number;

  /** Target completion date. Must be in the future. Format: YYYY-MM-DD. */
  @IsDateString()
  declare deadlineDate: string;

  /** Answers to the onboarding assessment quiz. */
  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AssessmentAnswerDto)
  declare quizAnswers: AssessmentAnswerDto[];
}
