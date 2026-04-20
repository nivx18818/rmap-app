import { type QuestionItem } from '../_types/personalized-questions-chat.types';

export const PERSONALIZED_QUESTIONS: QuestionItem[] = [
  {
    content: 'What is your primary goal for learning prompt engineering?',
    options: [
      'Find a full-time job',
      'Build personal projects/startups',
      'Freelance/side projects',
      'Career transition/Up-skilling',
    ],
  },
  {
    content: 'Which of these foundational concepts are you already comfortable with?',
    options: [
      'Basic HTML/CSS/JS',
      'Javascript fundamentals (ES6+)',
      'DOM manipulation and event handling',
      'None of the above',
    ],
  },
  {
    content: 'What is your preferred method for learning new technical skills?',
    options: [
      'Interactive coding platforms',
      'Video tutorials and courses',
      'Documentation and written guides',
      'Building projects and learning by doing',
    ],
  },
  {
    content: 'Which specific area of frontend development interests you the most?',
    options: [
      'User interface design and development',
      'Performance optimization and best practices',
      'Application architecture and state management',
      'Cross-platform development and responsive design',
    ],
  },
  {
    content: 'What type of environment are you aiming to work in?',
    options: [
      'Fast-paced startup environment',
      'Large tech company with established processes',
      'Agency setting with diverse projects',
      'Self-employed/freelance with flexible projects',
    ],
  },
  {
    content: 'Are you familiar with using version control systems like Git?',
    options: [
      'Yes, I use Git regularly',
      'I have some experience with Git',
      'I know the basics of Git',
      'No, I am not familiar with Git',
    ],
  },
  {
    content: 'How do you feel about learning backend-related concepts like APIs and databases?',
    options: ['Excited to learn', 'Neutral', 'A bit nervous', 'Not interested'],
  },
  {
    content: 'Do you have prior experience with any JavaScript frameworks or libraries?',
    options: ['None', 'React', 'Vue', 'Angular', 'Other (please specify)'],
  },
  {
    content:
      'What is your current level of experience with command-line interfaces or terminal usage?',
    options: [
      'I am very comfortable using the command line',
      'I have some experience with the command line',
      'I know the basics of using the command line',
      'I am not familiar with the command line',
    ],
  },
  {
    content: 'Do you have any other instructions or preferences?',
    options: [],
  },
];
