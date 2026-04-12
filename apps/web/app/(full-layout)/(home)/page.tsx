import type { Metadata } from 'next';

import { HeroSection, RoadmapSection, PersonalizedSection, ContactSection } from './_components';

export const metadata: Metadata = {
  title: 'RMap — Learn Effectively. Run any subject fearlessly.',
  description:
    'RMap helps learners map current skills to career goals and generate personalized developer learning roadmaps powered by AI.',
};

export default function Home() {
  return (
    <main>
      <HeroSection />
      <RoadmapSection />
      <PersonalizedSection />
      <ContactSection />
    </main>
  );
}
