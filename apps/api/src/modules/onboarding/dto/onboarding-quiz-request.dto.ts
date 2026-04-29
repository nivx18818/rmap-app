import { IsNotEmpty, IsString } from 'class-validator';

export class OnboardingQuizRequestDto {
  @IsString()
  @IsNotEmpty()
  topic!: string;
}
