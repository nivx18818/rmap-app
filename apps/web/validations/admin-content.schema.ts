import { z } from 'zod';

export const ROLE_CATEGORY_VALUES = [
  'WEB_DEVELOPMENT',
  'FRAMEWORKS',
  'ABSOLUTE_BEGINNERS',
  'LANGUAGES_AND_PLATFORMS',
  'DEVOPS',
  'DATABASES',
  'COMPUTER_SCIENCE',
  'DESIGN',
  'BEST_PRACTICES',
  'AI_AND_MACHINE_LEARNING',
  'DATA_ANALYSIS',
  'MOBILE_DEVELOPMENT',
  'MANAGEMENT',
  'GAME_DEVELOPMENT',
  'BLOCKCHAIN',
  'CYBER_SECURITY',
] as const;

export const RESOURCE_TYPE_VALUES = ['YOUTUBE', 'DOCS', 'COURSE', 'ARTICLE'] as const;

export const adminSkillFormSchema = z.object({
  defaultEstimatedHours: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^\d+(\.\d{1,2})?$/.test(value),
      'Use a positive number with up to 2 decimals',
    )
    .refine((value) => value === '' || Number(value) <= 9999.99, 'Must be 9999.99 or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less'),
  name: z.string().trim().min(1, 'Skill name is required').max(200),
  roleCategory: z.enum(ROLE_CATEGORY_VALUES),
});

export const adminResourceFormSchema = z.object({
  isFree: z.boolean(),
  isPrimary: z.boolean(),
  resourceType: z.enum(RESOURCE_TYPE_VALUES),
  title: z.string().trim().min(1, 'Resource title is required').max(200),
  url: z
    .string()
    .trim()
    .url('Enter a valid http or https URL')
    .refine((value) => /^https?:\/\//i.test(value), 'URL must start with http:// or https://'),
});

export const adminTemplateFormSchema = z.object({
  description: z.string().trim().min(1, 'Description is required').max(2000),
  estimatedWeeks: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), 'Use a whole number of weeks')
    .refine((value) => value === '' || Number(value) >= 1, 'Must be at least 1 week')
    .refine((value) => value === '' || Number(value) <= 520, 'Must be 520 weeks or less'),
  roleCategory: z.enum(ROLE_CATEGORY_VALUES),
  title: z.string().trim().min(1, 'Template title is required').max(200),
});

export type AdminResourceFormValues = z.infer<typeof adminResourceFormSchema>;
export type AdminSkillFormValues = z.infer<typeof adminSkillFormSchema>;
export type AdminTemplateFormValues = z.infer<typeof adminTemplateFormSchema>;
