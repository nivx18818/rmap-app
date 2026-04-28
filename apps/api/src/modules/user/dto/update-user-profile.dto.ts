import { IsString, Length } from 'class-validator';

export class UpdateUserProfileDto {
  @IsString()
  @Length(2, 100)
  fullName!: string;
}
