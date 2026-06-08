import { IsNotEmpty, IsString } from 'class-validator';

export class MobileOAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
