import { IsNotEmpty, IsString } from 'class-validator';

export class GithubMobileOAuthDto {
  @IsString()
  @IsNotEmpty()
  code!: string;
}
