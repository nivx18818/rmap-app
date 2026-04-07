import type { RoadmapNode } from '@/types/roadmap';

interface RoadmapGraphMobileProps {
  nodes: RoadmapNode[];
}

export function RoadmapGraphMobile({ nodes }: RoadmapGraphMobileProps) {
  return (
    <div className="grid gap-4 xl:hidden">
      {nodes.map((node, index) => (
        <article
          key={node.id}
          className="rounded-[20px] border border-[#e8dff4] bg-white/95 p-5 shadow-[0_12px_40px_rgba(26,22,57,0.06)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ede9fe] text-sm font-semibold text-[#6d28d9]">
              {index + 1}
            </div>
            <h2 className="font-heading text-xl leading-none font-medium tracking-[-0.03em] text-[#231535]">
              {node.label}
            </h2>
          </div>

          {node.skills.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {node.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="rounded-full border border-[#e9d5ff] bg-[#faf5ff] px-3 py-1.5 text-sm text-[#5b3f7d]"
                >
                  {skill.label}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
