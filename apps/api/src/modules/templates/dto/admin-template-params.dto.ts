import { IsUUID } from 'class-validator';

export class TemplateIdParamDto {
  @IsUUID('4')
  templateId!: string;
}

export class TemplateNodeIdParamDto extends TemplateIdParamDto {
  @IsUUID('4')
  nodeId!: string;
}
