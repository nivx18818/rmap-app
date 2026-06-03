import 'server-only';
import { cookies } from 'next/headers';

import type { RoadmapDetail } from '@/app/(full-layout)/roadmaps/[id]/_types/roadmap-detail.types';

import { ENDPOINTS } from '@/constants/endpoints';
import { fetchWrapper } from '@/lib/fetch-wrapper';

export async function getRoadmapMetadataData(roadmapId: string): Promise<null | RoadmapDetail> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (cookieHeader) {
    try {
      return await fetchWrapper<RoadmapDetail>(ENDPOINTS.roadmaps.getById(roadmapId), {
        cache: 'no-store',
        headers: {
          Cookie: cookieHeader,
        },
      });
    } catch {
      // Fall back to public template metadata below.
    }
  }

  try {
    return await fetchWrapper<RoadmapDetail>(ENDPOINTS.templates.getById(roadmapId), {
      cache: 'no-store',
    });
  } catch {
    return null;
  }
}
