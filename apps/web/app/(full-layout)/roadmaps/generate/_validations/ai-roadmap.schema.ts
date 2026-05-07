import { z } from 'zod';

export const stepOneSchema = z.object({
  goal: z.string().min(3, 'Please describe your goal'),
  hours_per_day: z.number().min(1).max(16),
  deadline_date: z.string().min(1, 'Please pick a deadline'),
});

export type StepOneValues = z.infer<typeof stepOneSchema>;
