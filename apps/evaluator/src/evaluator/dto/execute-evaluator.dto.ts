import { IsInt, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

const GITHUB_REPO_URL_PATTERN = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

export class ExecuteEvaluatorDto {
  @IsString()
  @MaxLength(200)
  submissionId!: string;

  @IsString()
  @Matches(GITHUB_REPO_URL_PATTERN)
  repoUrl!: string;

  @IsString()
  @MaxLength(100_000)
  testFileContent!: string;

  @IsInt()
  @Max(300_000)
  @Min(1_000)
  timeoutMs!: number;
}
