import { Card, CardContent, CardHeader } from '@repo/design-system/components/ui/card';
import { Separator } from '@repo/design-system/components/ui/separator';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';

export function ProfileSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
      {/* Sidebar skeleton */}
      <Card className="rounded-lg">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-14 shrink-0 rounded-lg" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Separator />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Main card skeleton */}
      <Card className="rounded-lg">
        <CardHeader className="border-b">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-1 h-3 w-72" />
        </CardHeader>
        <CardContent className="flex flex-col gap-8 pt-6">
          {/* Avatar section */}
          <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="size-20 shrink-0 rounded-xl" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32 rounded-md" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Personal details section */}
          <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        </CardContent>
        <div className="flex justify-end border-t px-6 py-4">
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </Card>
    </div>
  );
}
