'use client';

import { cn } from '@repo/design-system/lib/utils';
import { useMemo, useState } from 'react';

import type { RoadmapGraphNode, RoadmapTheme } from '@/types/roadmap';

type RoadmapNodePanelTab = 'resources' | 'tutor';

interface RoadmapNodePanelProps {
  aiTutorTabLabel: string;
  node: RoadmapGraphNode;
  onClose: () => void;
  resourcesTabLabel: string;
  statusLabels: Record<RoadmapGraphNode['status'], string>;
  theme: RoadmapTheme;
}

export function RoadmapNodePanel({
  aiTutorTabLabel,
  node,
  onClose,
  resourcesTabLabel,
  statusLabels,
  theme,
}: RoadmapNodePanelProps) {
  const [activeTab, setActiveTab] = useState<RoadmapNodePanelTab>('resources');
  const [selectedStatus, setSelectedStatus] = useState(node.status);

  const activeContent = useMemo(
    () => (activeTab === 'resources' ? node.panel.resources : node.panel.tutor),
    [activeTab, node.panel.resources, node.panel.tutor],
  );

  return (
    <>
      <button
        className="fixed inset-0 z-40"
        style={{ background: theme.panel.overlay }}
        type="button"
        aria-label="Close roadmap node panel"
        onClick={onClose}
      />

      <aside
        className="fixed top-0 right-0 z-50 flex h-screen flex-col overflow-hidden"
        style={{
          background: theme.panel.panel.background,
          borderLeft: `${theme.panel.panel.borderWidth} solid ${theme.panel.panel.borderColor}`,
          boxShadow: theme.panel.panel.shadow,
          width: theme.panel.panel.width,
        }}
      >
        <div
          className="flex items-start justify-between"
          style={{
            gap: theme.panel.content.gap,
            paddingLeft: theme.panel.content.paddingX,
            paddingRight: theme.panel.content.paddingX,
            paddingTop: theme.panel.content.paddingY,
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <PanelTabButton
              label={resourcesTabLabel}
              active={activeTab === 'resources'}
              theme={theme}
              onClick={() => setActiveTab('resources')}
            />
            <PanelTabButton
              label={aiTutorTabLabel}
              active={activeTab === 'tutor'}
              theme={theme}
              onClick={() => setActiveTab('tutor')}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`roadmap-node-status-${node.id}`}>
              Node status
            </label>
            <select
              id={`roadmap-node-status-${node.id}`}
              className="shrink-0 appearance-none outline-none"
              style={{
                background: theme.panel.statusSelect.background,
                border: `1px solid ${theme.panel.statusSelect.borderColor}`,
                borderRadius: theme.panel.statusSelect.radius,
                color: theme.panel.statusSelect.color,
                height: theme.panel.statusSelect.height,
                paddingLeft: theme.panel.statusSelect.paddingX,
                paddingRight: theme.panel.statusSelect.paddingX,
              }}
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value as keyof typeof statusLabels)
              }
            >
              {Object.entries(statusLabels).map(([status, label]) => (
                <option key={status} value={status}>
                  {label}
                </option>
              ))}
            </select>

            <button
              className="inline-flex items-center justify-center"
              style={{
                background: theme.panel.closeButton.background,
                border: `1px solid ${theme.panel.closeButton.borderColor}`,
                borderRadius: theme.panel.closeButton.radius,
                color: theme.panel.closeButton.color,
                height: theme.panel.closeButton.size,
                width: theme.panel.closeButton.size,
              }}
              type="button"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto"
          style={{
            paddingBottom: theme.panel.content.paddingY,
            paddingLeft: theme.panel.content.paddingX,
            paddingRight: theme.panel.content.paddingX,
            paddingTop: theme.panel.content.paddingY,
          }}
        >
          <div className="flex flex-col" style={{ gap: theme.panel.content.gap }}>
            <div className="space-y-5">
              <h2
                className="font-heading font-semibold"
                style={{
                  color: theme.panel.typography.titleColor,
                  fontSize: theme.panel.typography.titleSize,
                  letterSpacing: theme.panel.typography.titleLetterSpacing,
                  lineHeight: theme.panel.typography.titleLineHeight,
                }}
              >
                {node.label}
              </h2>
              <p
                style={{
                  color: theme.panel.typography.bodyColor,
                  fontSize: theme.panel.typography.bodyFontSize,
                  lineHeight: theme.panel.typography.bodyLineHeight,
                }}
              >
                {node.panel.description}
              </p>
            </div>

            {activeContent.sections.length > 0 ? (
              <div className="flex flex-col" style={{ gap: theme.panel.content.gap }}>
                {activeContent.sections.map((section) => {
                  const sectionTone = theme.panel.sectionBadge[section.tone];

                  return (
                    <section
                      key={section.id}
                      className="space-y-4"
                      style={{
                        borderTop: `1px solid ${theme.panel.dividerColor}`,
                        paddingTop: theme.panel.sectionPaddingTop,
                      }}
                    >
                      <div
                        className="inline-flex items-center justify-center border text-sm font-medium"
                        style={{
                          background: sectionTone.background,
                          borderColor: sectionTone.borderColor,
                          borderRadius: theme.panel.sectionBadge.radius,
                          color: sectionTone.color,
                          padding: '2px 10px',
                        }}
                      >
                        {section.label}
                      </div>

                      <div className="space-y-3">
                        {section.links.map((link) => (
                          <a
                            key={link.id}
                            className="block underline-offset-4 hover:underline"
                            style={{ color: theme.panel.typography.linkColor }}
                            href={link.url}
                            target={link.url.startsWith('#') ? undefined : '_blank'}
                            rel={link.url.startsWith('#') ? undefined : 'noreferrer'}
                          >
                            <span
                              className="mr-2 inline-flex items-center text-xs font-medium no-underline"
                              style={{
                                background: theme.panel.resourceTypeBadge.background,
                                borderRadius: theme.panel.resourceTypeBadge.radius,
                                color: theme.panel.resourceTypeBadge.color,
                                paddingBottom: theme.panel.resourceTypeBadge.paddingY,
                                paddingLeft: theme.panel.resourceTypeBadge.paddingX,
                                paddingRight: theme.panel.resourceTypeBadge.paddingX,
                                paddingTop: theme.panel.resourceTypeBadge.paddingY,
                              }}
                            >
                              {link.typeLabel}
                            </span>
                            {link.label}
                          </a>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div
                className="rounded-2xl border border-dashed p-4"
                style={{
                  borderColor: theme.panel.panel.borderColor,
                  color: theme.panel.typography.metaColor,
                }}
              >
                {activeContent.emptyLabel}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function PanelTabButton({
  active,
  label,
  onClick,
  theme,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  theme: RoadmapTheme;
}) {
  return (
    <button
      className={cn('inline-flex items-center justify-center text-sm font-medium')}
      style={{
        background: active ? theme.panel.tab.activeBackground : theme.panel.tab.inactiveBackground,
        border: `${theme.panel.tab.borderWidth} solid ${
          active ? theme.panel.tab.activeBorderColor : theme.panel.tab.inactiveBorderColor
        }`,
        borderRadius: theme.panel.tab.radius,
        color: active ? theme.panel.tab.activeColor : theme.panel.tab.inactiveColor,
        height: theme.panel.tab.height,
        paddingLeft: theme.panel.tab.paddingX,
        paddingRight: theme.panel.tab.paddingX,
      }}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
