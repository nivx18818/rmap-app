import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  passwordHash?: null | string;

  @IsOptional()
  @IsString()
  fullName!: string;
}
