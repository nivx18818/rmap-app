import {
  CircleLock01Icon,
  MedalFirstPlaceIcon,
  MedalSecondPlaceIcon,
  MedalThirdPlaceIcon,
  Progress01Icon,
  Progress02Icon,
  Progress03Icon,
  Progress04Icon,
  Tick04Icon,
} from '@hugeicons/core-free-icons';

import type { ProgressStatus, RoadmapNode } from '../_types/roadmap-node.types';

import { getNodeStatus } from './roadmap-node.utils';

export function getInProgressIconByChildren(children: RoadmapNode[]) {
  if (children.length === 0) return Progress01Icon;

  const completedCount = children.filter((child) => getNodeStatus(child) === 'COMPLETED').length;
  const completedPercent = (completedCount / children.length) * 100;

  if (completedPercent < 25) return Progress01Icon;
  if (completedPercent < 50) return Progress02Icon;
  if (completedPercent < 75) return Progress03Icon;

  return Progress04Icon;
}

export function getMilestoneMedalIcon(milestoneIndex: number) {
  if (milestoneIndex === 0) return MedalFirstPlaceIcon;
  if (milestoneIndex === 1) return MedalSecondPlaceIcon;
  return MedalThirdPlaceIcon;
}

export function getGroupStatusIcon(status: ProgressStatus, children: RoadmapNode[]) {
  if (status === 'LOCKED') return CircleLock01Icon;
  if (status === 'COMPLETED') return Tick04Icon;

  return getInProgressIconByChildren(children);
}

export function getGroupStatusIconClasses(status: ProgressStatus) {
  if (status === 'LOCKED') return 'bg-zinc-200 text-foreground';
  if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-600';

  return 'bg-primary/10 text-primary';
}
