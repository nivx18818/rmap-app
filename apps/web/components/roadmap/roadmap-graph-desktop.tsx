import { cn } from '@repo/design-system/lib/utils';

import type { RoadmapNode } from '@/types/roadmap';

import {
  ARTBOARD_WIDTH,
  FIGMA_GRAPH_ILLUSTRATION,
  MAIN_NODE_WIDTH,
  MAIN_NODE_X,
  getNodeByLabel,
  ROW_CONFIGS,
  SPECIAL_ROW_BRIDGES,
  splitSkillGroups,
} from './roadmap-graph-layout';
import { MainNode, SkillPill } from './roadmap-graph-primitives';

interface RoadmapGraphDesktopProps {
  nodes: RoadmapNode[];
}

function TopGraphCluster({ nodes }: { nodes: RoadmapNode[] }) {
  const internet = getNodeByLabel(nodes, 'Internet');
  const html = getNodeByLabel(nodes, 'HTML');
  const css = getNodeByLabel(nodes, 'CSS');
  const javascript = getNodeByLabel(nodes, 'JavaScript');

  if (!internet || !html || !css || !javascript) {
    return null;
  }

  const internetSkills = internet.skills;
  const htmlSkills = html.skills.slice(0, 3);
  const cssSkills = css.skills.slice(0, 2);
  const javascriptSkills = javascript.skills.slice(0, 3);

  return (
    <>
      <div className="absolute top-[220px] left-[92px] h-[322px] w-[344px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="block h-full w-full object-contain" alt="" src={FIGMA_GRAPH_ILLUSTRATION} />
      </div>

      <div className="absolute top-[54px] left-1/2 flex -translate-x-1/2 flex-col items-center">
        <div className="mb-7 h-[126px] w-[6px] rounded-full bg-[radial-gradient(circle,_#4f46e5_0%,_#4f46e5_55%,_transparent_58%)] [background-size:6px_16px]" />
        <p className="font-heading text-[48px] leading-none font-medium text-black">Front-end</p>
      </div>

      <div className="absolute top-[246px] left-1/2 h-[1810px] w-[4px] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(17,24,39,0),rgba(17,24,39,1)_10%,rgba(17,24,39,1)_90%,rgba(17,24,39,0))]" />

      <MainNode className="absolute top-[492px] left-1/2 -translate-x-1/2" node={internet} />
      <MainNode className="absolute top-[718px] left-1/2 -translate-x-1/2" node={html} />
      <MainNode className="absolute top-[814px] left-1/2 -translate-x-1/2" node={css} />
      <MainNode className="absolute top-[910px] left-1/2 -translate-x-1/2" node={javascript} />

      <div className="absolute top-[442px] left-[930px] h-[4px] w-[58px] border-t-[4px] border-dotted border-[#111827]" />
      <div className="absolute top-[522px] left-[930px] h-[4px] w-[58px] border-t-[4px] border-dotted border-[#111827]" />
      <div className="absolute top-[602px] left-[930px] h-[4px] w-[58px] border-t-[4px] border-dotted border-[#111827]" />
      <div className="absolute top-[682px] left-[930px] h-[4px] w-[58px] border-t-[4px] border-dotted border-[#111827]" />

      <div className="absolute top-[754px] left-[534px] h-[4px] w-[96px] bg-[#6b7280]" />
      <div className="absolute top-[834px] left-[534px] h-[4px] w-[96px] bg-[#6b7280]" />
      <div className="absolute top-[914px] left-[534px] h-[4px] w-[96px] bg-[#6b7280]" />

      <div className="absolute top-[1022px] left-[930px] h-[4px] w-[86px] bg-[#6b7280]" />
      <div className="absolute top-[1102px] left-[930px] h-[4px] w-[86px] bg-[#6b7280]" />

      <div className="absolute top-[1356px] left-[930px] h-[4px] w-[20px] bg-[#6b7280]" />

      <div className="absolute top-[410px] left-[1006px] flex flex-col gap-4">
        {internetSkills.map((skill) => (
          <div key={skill.id} className="relative pl-8">
            <div className="absolute top-1/2 left-0 h-[5px] w-[30px] -translate-y-1/2 border-t-[5px] border-dotted border-[#111827]" />
            <SkillPill size="large" className="w-[424px]" side="left" skill={skill} />
          </div>
        ))}
      </div>

      <div className="absolute top-[672px] left-[90px] flex flex-col gap-4">
        {htmlSkills.map((skill) => (
          <div key={skill.id} className="relative pr-10">
            <div className="absolute top-1/2 right-0 h-[4px] w-[54px] -translate-y-1/2 bg-[#6b7280]" />
            <SkillPill size="large" className="w-[390px]" side="right" skill={skill} />
          </div>
        ))}
      </div>

      <div className="absolute top-[986px] left-[1038px] flex flex-col gap-4">
        {cssSkills.map((skill) => (
          <div key={skill.id} className="relative pl-10">
            <div className="absolute top-1/2 left-0 h-[4px] w-[54px] -translate-y-1/2 bg-[#6b7280]" />
            <SkillPill size="large" className="w-[278px]" side="left" skill={skill} />
          </div>
        ))}
      </div>

      <div className="absolute top-[1328px] left-[950px] flex gap-3">
        {javascriptSkills.map((skill) => (
          <div key={skill.id} className="relative pl-8">
            <div className="absolute top-1/2 left-0 h-[4px] w-[24px] -translate-y-1/2 bg-[#6b7280]" />
            <SkillPill size="large" className="w-[188px]" side="left" skill={skill} />
          </div>
        ))}
      </div>
    </>
  );
}

function GraphRows({ nodes }: { nodes: RoadmapNode[] }) {
  return (
    <>
      {ROW_CONFIGS.map((config) => {
        const node = getNodeByLabel(nodes, config.key);

        if (!node) {
          return null;
        }

        const { left, right } = splitSkillGroups(node);
        const nodeCenterY = config.y + 29;
        const specialBridges = SPECIAL_ROW_BRIDGES[node.label];

        return (
          <div key={node.id}>
            <div
              className="absolute"
              style={{
                left: `${MAIN_NODE_X}px`,
                top: `${config.y}px`,
              }}
            >
              <MainNode node={node} />
            </div>

            {config.left
              ? (() => {
                  const leftConfig = config.left;

                  return (
                    <>
                      {specialBridges?.left ? (
                        <div
                          className="absolute h-[4px] bg-[#6b7280]"
                          style={{
                            left: `${specialBridges.left.left}px`,
                            top: `${specialBridges.left.top}px`,
                            width: `${specialBridges.left.width}px`,
                          }}
                        />
                      ) : (
                        <div
                          className="absolute h-[4px] bg-[#6b7280]"
                          style={{
                            left: `${leftConfig.bridgeToX ?? leftConfig.x + 520}px`,
                            top: `${nodeCenterY}px`,
                            width: `${MAIN_NODE_X - (leftConfig.bridgeToX ?? leftConfig.x + 520) + 2}px`,
                          }}
                        />
                      )}

                      <div
                        className="absolute"
                        style={{ left: `${leftConfig.x}px`, top: `${leftConfig.y}px` }}
                      >
                        <div
                          className={cn(
                            'flex',
                            leftConfig.direction === 'column'
                              ? 'flex-col'
                              : 'flex-row items-center',
                          )}
                          style={{ gap: `${leftConfig.gap ?? 16}px` }}
                        >
                          {left.map((skill, index) => (
                            <div key={skill.id} className="relative pr-8">
                              <div
                                className="absolute top-1/2 right-0 h-[4px] -translate-y-1/2 bg-[#6b7280]"
                                style={{ width: `${leftConfig.connectorWidth ?? 34}px` }}
                              />
                              <SkillPill
                                minWidth={leftConfig.pillMinWidth}
                                side="right"
                                skill={skill}
                              />
                              {leftConfig.direction === 'row' && index < left.length - 1 ? (
                                <div className="absolute top-1/2 -left-3 h-[4px] w-[12px] -translate-y-1/2 bg-[#6b7280]" />
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()
              : null}

            {config.right
              ? (() => {
                  const rightConfig = config.right;

                  return (
                    <>
                      {specialBridges?.right ? (
                        <div
                          className="absolute h-[4px] bg-[#6b7280]"
                          style={{
                            left: `${specialBridges.right.left}px`,
                            top: `${specialBridges.right.top}px`,
                            width: `${specialBridges.right.width}px`,
                          }}
                        />
                      ) : (
                        <div
                          className="absolute h-[4px] bg-[#6b7280]"
                          style={{
                            left: `${MAIN_NODE_X + MAIN_NODE_WIDTH}px`,
                            top: `${nodeCenterY}px`,
                            width: `${(rightConfig.bridgeToX ?? rightConfig.x) - (MAIN_NODE_X + MAIN_NODE_WIDTH) + 4}px`,
                          }}
                        />
                      )}

                      <div
                        className="absolute"
                        style={{ left: `${rightConfig.x}px`, top: `${rightConfig.y}px` }}
                      >
                        <div
                          className={cn(
                            'flex',
                            rightConfig.direction === 'column'
                              ? 'flex-col'
                              : 'flex-row items-center',
                          )}
                          style={{ gap: `${rightConfig.gap ?? 16}px` }}
                        >
                          {right.map((skill, index) => (
                            <div key={skill.id} className="relative pl-8">
                              <div
                                className="absolute top-1/2 left-0 h-[4px] -translate-y-1/2 bg-[#6b7280]"
                                style={{ width: `${rightConfig.connectorWidth ?? 34}px` }}
                              />
                              <SkillPill
                                minWidth={rightConfig.pillMinWidth}
                                side="left"
                                skill={skill}
                              />
                              {rightConfig.direction === 'row' && index < right.length - 1 ? (
                                <div className="absolute top-1/2 -right-3 h-[4px] w-[12px] -translate-y-1/2 bg-[#6b7280]" />
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()
              : null}
          </div>
        );
      })}
    </>
  );
}

export function RoadmapGraphDesktop({ nodes }: RoadmapGraphDesktopProps) {
  const scale = 0.52;

  return (
    <div className="hidden xl:block">
      <div className="relative mx-auto h-[2280px] w-full max-w-[1320px] overflow-hidden">
        <div
          className="absolute top-0 left-1/2 origin-top"
          style={{ transform: `translateX(-50%) scale(${scale})`, width: `${ARTBOARD_WIDTH}px` }}
        >
          <div className="relative h-[4340px] w-[1560px]">
            <TopGraphCluster nodes={nodes} />
            <GraphRows nodes={nodes} />
          </div>
        </div>
      </div>
    </div>
  );
}
