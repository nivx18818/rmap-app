import type { Metadata } from 'next';

import LandingPage from '@/components/landing';

export const metadata: Metadata = {
  title: 'RMap — Learn Effectively. Run any subject fearlessly.',
  description:
    'RMap helps learners map current skills to career goals and generate personalized developer learning roadmaps powered by AI.',
};

export default function Home() {
  return <LandingPage />;
}
