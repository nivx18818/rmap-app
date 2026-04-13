import { type QuestionItem } from '../_types/personalized-questions-chat.types';

export const PERSONALIZED_QUESTIONS: QuestionItem[] = [
  {
    content: 'What is your primary goal for learning prompt engineering?',
    options: [
      'Build projects faster',
      'Automate repetitive workflows',
      'Improve AI product skills',
      'Prepare for interviews',
    ],
  },
  {
    content: 'How would you describe your current experience level with AI tools?',
    options: ['Beginner', 'Intermediate', 'Advanced', 'I am not sure yet'],
  },
  {
    content: 'What learning style helps you stay consistent the most?',
    options: [
      'Hands-on mini projects',
      'Step-by-step theory first',
      'Video-heavy learning',
      'Reading docs and notes',
    ],
  },
];
