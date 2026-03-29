import { ContactSection } from './contact-section';
import { HeroSection } from './hero-section';
import { PersonalizedSection } from './personalized-section';
import { RoadmapSection } from './roadmap-section';

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <RoadmapSection />
      <PersonalizedSection />
      <ContactSection />
    </main>
  );
}
