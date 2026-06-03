import type { Metadata } from 'next';

import { getRoadmapMetadataData } from '@/server-fetcher/roadmap-metadata-server';
import { decodeReadableUrlId } from '@/utils/roadmap-url';

const FALLBACK_METADATA: Metadata = {
  title: 'Roadmap Detail | RMap',
  description: 'View your roadmap details.',
};

interface RoadmapDetailMetadataProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: RoadmapDetailMetadataProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const roadmapId = decodeReadableUrlId(id);
    const roadmap = await getRoadmapMetadataData(roadmapId);
    const title = roadmap?.title.trim();

    if (!title) {
      return FALLBACK_METADATA;
    }

    const description = roadmap?.description?.trim();

    return {
      title: `${title} | RMap`,
      description: description || `View ${title} roadmap details.`,
    };
  } catch {
    return FALLBACK_METADATA;
  }
}

export default function RoadmapDetailLayout(props: LayoutProps<'/roadmaps/[id]'>) {
  return props.children;
}
