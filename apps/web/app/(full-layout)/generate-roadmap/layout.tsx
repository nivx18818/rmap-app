import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Roadmap | RMap',
  description: 'Create your personalized roadmap with AI.',
};

export default function AILayout(props: LayoutProps<'/ai'>) {
  return props.children;
}
