import type { RoadmapTemplate } from '@/app/(full-layout)/(home)/_types/landing';

import { ENDPOINTS } from '@/constants/endpoints';
import { fetchWrapper } from '@/lib/fetch-wrapper';

const TEMPLATES_PER_PAGE = 100;

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface PaginatedTemplatesResponse {
  data: RoadmapTemplate[];
  meta: PaginationMeta;
}

function getTemplatesPath(page: number): string {
  const params = new URLSearchParams({
    page: String(page),
    perPage: String(TEMPLATES_PER_PAGE),
  });

  return `${ENDPOINTS.templates.list}?${params.toString()}`;
}

async function listTemplatesPage(page: number): Promise<PaginatedTemplatesResponse> {
  return fetchWrapper<PaginatedTemplatesResponse>(getTemplatesPath(page), {
    cache: 'no-store',
  });
}

export const templateService = {
  getAllTemplates: async (): Promise<RoadmapTemplate[]> => {
    const firstPage = await listTemplatesPage(1);
    const remainingPageNumbers = Array.from(
      { length: Math.max(firstPage.meta.totalPages - 1, 0) },
      (_, index) => index + 2,
    );

    const remainingPages = await Promise.all(remainingPageNumbers.map(listTemplatesPage));

    return [firstPage, ...remainingPages].flatMap((page) => page.data);
  },
};
