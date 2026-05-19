import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roadmap Detail | RMap',
  description: 'View your roadmap details.',
};

export default function RoadmapDetailLayout(props: LayoutProps<'/roadmaps/[id]'>) {
  return props.children;
}
