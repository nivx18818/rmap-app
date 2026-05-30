import type { Route } from 'next';

import { Route01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import Link from 'next/link';

export function DashboardEmptyState() {
  return (
    <Card className="mx-auto max-w-2xl rounded-lg">
      <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
        <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
          <HugeiconsIcon className="size-6" icon={Route01Icon} />
        </div>
        <div className="flex max-w-xl flex-col gap-2">
          <h2 className="text-heading text-2xl">Create your first roadmap</h2>
          <p className="text-muted-foreground text-sm leading-6 sm:text-base">
            Your dashboard will show roadmap completion, streak activity, and skill readiness after
            you generate a personalized learning plan.
          </p>
        </div>
        <Button
          size="lg"
          render={<Link href={'/roadmaps/generate' as Route<string>}>Start onboarding</Link>}
        />
      </CardContent>
    </Card>
  );
}
