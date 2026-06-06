import { Type } from 'class-transformer';
import { IsInt, IsUUID, Min } from 'class-validator';

export class SkillResourceListParamsDto {
  @IsUUID('4')
  skillId!: string;
}

export class SkillResourceParamsDto extends SkillResourceListParamsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  resourceId!: number;
}
