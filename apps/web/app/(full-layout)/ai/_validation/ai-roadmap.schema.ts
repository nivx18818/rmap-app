import { z } from 'zod';

export const aiRoadmapSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  hours: z.number({ required_error: 'Hours per day is required' }).min(1),
  duration: z.number({ required_error: 'Duration is required' }).min(1),
  isPersonalized: z.boolean().default(false),
});

export type AiRoadmapValues = z.infer<typeof aiRoadmapSchema>;
