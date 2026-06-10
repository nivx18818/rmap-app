import { IsUUID } from 'class-validator';

export class SkillPrerequisiteListParamsDto {
  @IsUUID('4')
  skillId!: string;
}

export class SkillPrerequisiteParamsDto extends SkillPrerequisiteListParamsDto {
  @IsUUID('4')
  prereqSkillId!: string;
}
