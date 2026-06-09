import { IsUUID } from 'class-validator';

export class CreateSkillPrerequisiteDto {
  @IsUUID('4')
  prerequisiteSkillId!: string;
}
