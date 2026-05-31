import { Skeleton } from '@repo/design-system/components/ui/skeleton';

export function RoadmapTemplatesSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex w-full items-center justify-center px-4 md:px-12 lg:px-32 xl:px-72">
        <Skeleton className="h-12 w-full max-w-140 rounded-full" />
      </div>

      <div className="border-border/70 bg-background/65 flex w-full flex-col overflow-hidden rounded-2xl border shadow-sm md:grid md:grid-cols-[15rem_1fr]">
        <aside className="border-border/70 bg-background/75 border-b md:border-r md:border-b-0">
          <div className="flex flex-row gap-2 overflow-x-hidden p-4 md:flex-col">
            {Array.from({ length: 9 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-24 shrink-0 rounded-md md:w-full" />
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-8 p-4 md:p-8">
          {Array.from({ length: 3 }, (_, sectionIndex) => (
            <div key={sectionIndex} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, itemIndex) => (
                  <Skeleton key={itemIndex} className="h-12 rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
