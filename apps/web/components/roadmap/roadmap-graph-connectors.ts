import type { RelationType, RoadmapTheme } from '@/types/roadmap';

export interface MeasuredPoint {
  x: number;
  y: number;
}

export interface ConnectorPath {
  d: string;
  tone: 'header' | 'main' | RelationType;
}

export function getPoint(
  container: HTMLDivElement,
  element: HTMLElement | null,
): MeasuredPoint | null {
  if (!element) {
    return null;
  }

  const containerRect = container.getBoundingClientRect();
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left - containerRect.left + rect.width / 2,
    y: rect.top - containerRect.top + rect.height / 2,
  };
}

export function buildSmoothVerticalPath(from: MeasuredPoint, to: MeasuredPoint) {
  const midY = (from.y + to.y) / 2;

  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
}

export function buildSmoothSkillPath(from: MeasuredPoint, to: MeasuredPoint) {
  const dx = to.x - from.x;
  const tension = Math.min(Math.abs(dx) * 0.6, 80);
  const dirX = dx >= 0 ? 1 : -1;

  const cp1x = from.x + dirX * tension;
  const cp2x = to.x - dirX * tension;

  return `M ${from.x} ${from.y} C ${cp1x} ${from.y}, ${cp2x} ${to.y}, ${to.x} ${to.y}`;
}

export function getConnectorStroke(tone: ConnectorPath['tone'], theme: RoadmapTheme) {
  if (tone === 'main') {
    return theme.connector.main.stroke;
  }

  if (tone === 'header') {
    return theme.connector.header.stroke;
  }

  return tone === 'optional' ? theme.connector.optional.stroke : theme.connector.required.stroke;
}

export function getConnectorDashArray(tone: ConnectorPath['tone'], theme: RoadmapTheme) {
  if (tone === 'header') {
    return theme.connector.header.dashArray;
  }

  if (tone === 'main') {
    return theme.connector.main.dashArray;
  }

  return tone === 'optional'
    ? theme.connector.optional.dashArray
    : theme.connector.required.dashArray;
}

export function getConnectorStrokeWidth(tone: ConnectorPath['tone'], theme: RoadmapTheme) {
  if (tone === 'header') {
    return theme.connector.header.strokeWidth;
  }

  if (tone === 'main') {
    return theme.connector.main.strokeWidth;
  }

  return tone === 'optional'
    ? theme.connector.optional.strokeWidth
    : theme.connector.required.strokeWidth;
}

export function getConnectorAnimation(tone: ConnectorPath['tone'], theme: RoadmapTheme) {
  if (tone === 'main') {
    return `roadmap-dash ${theme.connector.main.animationDuration} linear infinite`;
  }

  if (tone === 'header') {
    return undefined;
  }

  return tone === 'optional'
    ? `roadmap-dash ${theme.connector.optional.animationDuration} linear infinite`
    : `roadmap-dash ${theme.connector.required.animationDuration} linear infinite`;
}
