import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/modules/prisma/prisma.service';

import type {
  AdminActivityType,
  AdminDashboardActivityItem,
  AdminDashboardResponse,
} from './types/admin-dashboard-response.types';

const RECENT_ACTIVITY_LIMIT = 8;

type ActivityRecord = {
  id: string;
  label: string;
  timestamp: Date;
  type: AdminActivityType;
};

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(): Promise<AdminDashboardResponse> {
    const [
      skills,
      templates,
      resources,
      templateNodes,
      recentSkills,
      recentTemplates,
      recentResources,
      recentTemplateNodes,
    ] = await this.prisma.$transaction([
      this.prisma.skill.count(),
      this.prisma.roadmap.count({ where: { isTemplate: true } }),
      this.prisma.resource.count(),
      this.prisma.roadmapNode.count({ where: { roadmap: { isTemplate: true } } }),
      this.prisma.skill.findMany({
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: { id: true, name: true, updatedAt: true },
        take: RECENT_ACTIVITY_LIMIT,
      }),
      this.prisma.roadmap.findMany({
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: { id: true, title: true, updatedAt: true },
        take: RECENT_ACTIVITY_LIMIT,
        where: { isTemplate: true },
      }),
      this.prisma.resource.findMany({
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: { id: true, title: true, updatedAt: true },
        take: RECENT_ACTIVITY_LIMIT,
      }),
      this.prisma.roadmapNode.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        select: { createdAt: true, id: true, name: true },
        take: RECENT_ACTIVITY_LIMIT,
        where: { roadmap: { isTemplate: true } },
      }),
    ]);

    return {
      recentActivity: [
        ...recentSkills.map((skill) =>
          this.toActivityItem({
            id: skill.id,
            label: skill.name,
            timestamp: skill.updatedAt,
            type: 'skill',
          }),
        ),
        ...recentTemplates.map((template) =>
          this.toActivityItem({
            id: template.id,
            label: template.title,
            timestamp: template.updatedAt,
            type: 'template',
          }),
        ),
        ...recentResources.map((resource) =>
          this.toActivityItem({
            id: String(resource.id),
            label: resource.title,
            timestamp: resource.updatedAt,
            type: 'resource',
          }),
        ),
        ...recentTemplateNodes.map((node) =>
          this.toActivityItem({
            id: node.id,
            label: node.name,
            timestamp: node.createdAt,
            type: 'template_node',
          }),
        ),
      ]
        .sort(
          (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp) || a.id.localeCompare(b.id),
        )
        .slice(0, RECENT_ACTIVITY_LIMIT),
      totals: {
        resources,
        skills,
        templateNodes,
        templates,
      },
    };
  }

  private toActivityItem(record: ActivityRecord): AdminDashboardActivityItem {
    return {
      id: record.id,
      label: record.label,
      timestamp: record.timestamp.toISOString(),
      type: record.type,
    };
  }
}
