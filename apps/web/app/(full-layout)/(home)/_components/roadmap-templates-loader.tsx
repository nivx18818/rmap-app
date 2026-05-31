import { templateService } from '@/services/template.service';

import { RoadmapTemplatesBrowser } from './roadmap-templates-browser';

const ROADMAP_TEMPLATES_ERROR_MESSAGE = 'Unable to load roadmap templates.';

export async function RoadmapTemplatesLoader() {
  try {
    const templates = await templateService.getAllTemplates();

    return <RoadmapTemplatesBrowser templates={templates} />;
  } catch {
    return <RoadmapTemplatesBrowser loadErrorMessage={ROADMAP_TEMPLATES_ERROR_MESSAGE} />;
  }
}
