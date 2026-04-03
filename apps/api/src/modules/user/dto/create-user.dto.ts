import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  passwordHash!: string;

  @IsOptional()
  @IsString()
  fullName!: string;
}
