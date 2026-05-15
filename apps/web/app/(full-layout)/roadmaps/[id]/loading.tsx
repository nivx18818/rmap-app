import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';

export default function RoadmapDetailLoading() {
  return (
    <main className="bg-background min-h-screen">
      <SectionContainer className="flex flex-col gap-6 pt-32 pb-20">
        <Skeleton className="h-8 w-36" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-14 w-full max-w-xl" />
          <Skeleton className="h-6 w-full max-w-3xl" />
        </div>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-[72vh] min-h-150 w-full" />
      </SectionContainer>
    </main>
  );
}
