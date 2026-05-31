import type {
  RoadmapItemData,
  RoadmapTemplate,
  RoadmapTemplateGroup,
} from '@/app/(full-layout)/(home)/_types/landing';

const CATEGORY_COLLATOR = new Intl.Collator('en-US', {
  sensitivity: 'base',
});

export function formatRoadmapTemplateCategory(category: string): string {
  return category
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}

export function groupRoadmapTemplates(templates: RoadmapTemplate[]): RoadmapTemplateGroup[] {
  const itemsByCategory = new Map<string, RoadmapItemData[]>();

  templates.forEach((template) => {
    const categoryItems = itemsByCategory.get(template.roleCategory) ?? [];

    categoryItems.push({
      href: `/roadmaps/${template.id}`,
      id: template.id,
      label: template.title,
    });

    itemsByCategory.set(template.roleCategory, categoryItems);
  });

  return [...itemsByCategory.entries()]
    .map(([category, items]) => ({
      category,
      items: [...items].sort((left, right) => CATEGORY_COLLATOR.compare(left.label, right.label)),
      label: formatRoadmapTemplateCategory(category),
    }))
    .sort((left, right) => CATEGORY_COLLATOR.compare(left.label, right.label));
}
