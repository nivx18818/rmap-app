'use client';

import type { ComponentProps } from 'react';

import {
  AiBrain01Icon,
  ArrowRight02FreeIcons,
  Book02Icon,
  Blockchain01Icon,
  ChartAnalysisIcon,
  CheckmarkCircle02Icon,
  CodeFolderIcon,
  ComputerActivityIcon,
  Database01Icon,
  GameController01Icon,
  LanguageSkillIcon,
  ManagerIcon,
  MobileProgramming01Icon,
  PaintBrush02Icon,
  ServerStack01Icon,
  Shield01Icon,
  Target02Icon,
  WebDesign01Icon,
  TargetDollarIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { cn } from '@repo/design-system/lib/utils';
import { useState } from 'react';

import type { DashboardSkillCategory } from '../../_types/dashboard.types';

import { NUMBER_FORMATTER } from '../../_utils/formatters';

const ROLE_CATEGORY_ICON_MAP = {
  ABSOLUTE_BEGINNERS: {
    className: 'text-amber-500',
    icon: Book02Icon,
  },
  AI_AND_MACHINE_LEARNING: {
    className: 'text-fuchsia-500',
    icon: AiBrain01Icon,
  },
  BEST_PRACTICES: {
    className: 'text-emerald-500',
    icon: CheckmarkCircle02Icon,
  },
  BLOCKCHAIN: {
    className: 'text-orange-500',
    icon: Blockchain01Icon,
  },
  COMPUTER_SCIENCE: {
    className: 'text-cyan-500',
    icon: ComputerActivityIcon,
  },
  CYBER_SECURITY: {
    className: 'text-red-500',
    icon: Shield01Icon,
  },
  DATABASES: {
    className: 'text-blue-500',
    icon: Database01Icon,
  },
  DATA_ANALYSIS: {
    className: 'text-indigo-500',
    icon: ChartAnalysisIcon,
  },
  DESIGN: {
    className: 'text-pink-500',
    icon: PaintBrush02Icon,
  },
  DEVOPS: {
    className: 'text-slate-500',
    icon: ServerStack01Icon,
  },
  FRAMEWORKS: {
    className: 'text-violet-500',
    icon: CodeFolderIcon,
  },
  GAME_DEVELOPMENT: {
    className: 'text-lime-600',
    icon: GameController01Icon,
  },
  LANGUAGES_AND_PLATFORMS: {
    className: 'text-sky-500',
    icon: LanguageSkillIcon,
  },
  MANAGEMENT: {
    className: 'text-teal-600',
    icon: ManagerIcon,
  },
  MOBILE_DEVELOPMENT: {
    className: 'text-green-500',
    icon: MobileProgramming01Icon,
  },
  WEB_DEVELOPMENT: {
    className: 'text-primary',
    icon: WebDesign01Icon,
  },
} satisfies Record<
  string,
  {
    className: string;
    icon: ComponentProps<typeof HugeiconsIcon>['icon'];
  }
>;

function getRoleCategoryIcon(category: string) {
  return (
    ROLE_CATEGORY_ICON_MAP[category as keyof typeof ROLE_CATEGORY_ICON_MAP] ?? {
      className: 'text-primary',
      icon: Target02Icon,
    }
  );
}

interface SidebarSkillCategoriesProps {
  skillCategories: DashboardSkillCategory[];
}

export function SidebarSkillCategories({ skillCategories }: SidebarSkillCategoriesProps) {
  const [isShowingAllSkills, setIsShowingAllSkills] = useState(false);
  const visibleSkillCategories = isShowingAllSkills ? skillCategories : skillCategories.slice(0, 5);

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon className="text-primary size-5" icon={TargetDollarIcon} />
          Skill categories
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {visibleSkillCategories.map((category) => (
          <div
            key={category.category}
            className="flex min-w-0 items-center justify-between gap-3 text-sm"
          >
            <span className="text-muted-foreground flex min-w-0 items-center gap-2">
              <HugeiconsIcon
                className={cn('size-4 shrink-0', getRoleCategoryIcon(category.category).className)}
                icon={getRoleCategoryIcon(category.category).icon}
              />
              <span className="truncate">{category.label}</span>
            </span>
            <span className="font-semibold">{NUMBER_FORMATTER.format(category.totalSkills)}</span>
          </div>
        ))}
        {skillCategories.length === 0 ? (
          <p className="text-muted-foreground text-sm">No categories yet.</p>
        ) : null}
        {skillCategories.length >= 5 ? (
          <Button
            size="sm"
            variant="link"
            className="text-primary h-auto w-fit justify-start px-0 py-0"
            type="button"
            onClick={() => setIsShowingAllSkills((current) => !current)}
          >
            {isShowingAllSkills ? 'Show fewer skills' : 'View all skills'}
            <HugeiconsIcon data-icon="inline-end" icon={ArrowRight02FreeIcons} />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
