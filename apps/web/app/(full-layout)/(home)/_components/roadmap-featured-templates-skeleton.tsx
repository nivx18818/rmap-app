import { Skeleton } from '@repo/design-system/components/ui/skeleton';

export function RoadmapFeaturedTemplatesSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, index) => (
          <Skeleton key={index} className="h-38 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
