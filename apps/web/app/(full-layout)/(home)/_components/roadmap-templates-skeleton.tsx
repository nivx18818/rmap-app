import { Skeleton } from '@repo/design-system/components/ui/skeleton';

export function RoadmapTemplatesSkeleton() {
  return (
    <div className="flex w-full flex-col gap-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
        <Skeleton className="h-12 w-80 max-w-full" />
        <Skeleton className="h-5 w-full max-w-xl" />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-52" />
        </div>
      </div>

      <div className="border-border/70 bg-muted/40 grid w-full overflow-hidden rounded-lg border shadow-sm lg:grid-cols-[15rem_1fr]">
        <aside className="border-border/70 bg-background/60 border-b p-4 lg:border-r lg:border-b-0">
          <div className="flex gap-2 overflow-x-auto lg:flex-col">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-9 w-36 shrink-0 lg:w-full" />
            ))}
          </div>
        </aside>
        <div className="flex flex-col gap-6 p-4 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-10 w-full md:max-w-xs" />
          </div>
          {Array.from({ length: 3 }, (_, sectionIndex) => (
            <div key={sectionIndex} className="flex flex-col gap-3">
              <Skeleton className="h-4 w-36" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, itemIndex) => (
                  <Skeleton key={itemIndex} className="h-11 rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
