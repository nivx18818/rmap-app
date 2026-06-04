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

function shuffleTemplates(templates: RoadmapTemplate[]): RoadmapTemplate[] {
  const shuffledTemplates = [...templates];

  for (let index = shuffledTemplates.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const currentTemplate = shuffledTemplates[index] as RoadmapTemplate;
    const randomTemplate = shuffledTemplates[randomIndex] as RoadmapTemplate;

    shuffledTemplates[index] = randomTemplate;
    shuffledTemplates[randomIndex] = currentTemplate;
  }

  return shuffledTemplates;
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

  getRandomTemplates: async (count: number): Promise<RoadmapTemplate[]> => {
    const templates = await templateService.getAllTemplates();

    return shuffleTemplates(templates).slice(0, count);
  },
};
