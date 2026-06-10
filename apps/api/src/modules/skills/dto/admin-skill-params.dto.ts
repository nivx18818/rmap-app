import { IsUUID } from 'class-validator';

export class SkillIdParamDto {
  @IsUUID('4')
  skillId!: string;
}
