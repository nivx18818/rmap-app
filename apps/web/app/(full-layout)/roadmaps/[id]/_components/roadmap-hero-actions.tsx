import {
  Delete02Icon,
  // Download01Icon,
  PlayIcon,
  Refresh01Icon,
  // SaveIcon,
  // Share01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@repo/design-system/components/ui/alert-dialog';
import { Button } from '@repo/design-system/components/ui/button';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { useState } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';

export interface HeroActionsProps {
  actionMode: 'default' | 'loading' | 'preview';
  canRecreate: boolean;
  isActionBusy: boolean;
  isRecreatingRoadmap: boolean;
  isStartingLearning: boolean;
  onRecreateRoadmap?: () => void;
  onStartLearning?: () => void;
}

export function HeroActions({
  actionMode,
  canRecreate,
  isActionBusy,
  isRecreatingRoadmap,
  isStartingLearning,
  onRecreateRoadmap,
  onStartLearning,
}: HeroActionsProps) {
  // const isMobile = useIsMobile();
  const [isRecreateDialogOpen, setIsRecreateDialogOpen] = useState(false);
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);

  const handleConfirmRecreate = () => {
    setIsRecreateDialogOpen(false);
    onRecreateRoadmap?.();
  };

  const handleConfirmStart = () => {
    setIsStartDialogOpen(false);
    onStartLearning?.();
  };

  if (actionMode === 'loading') {
    return (
      <div className="grid w-full gap-2 sm:flex sm:w-auto sm:items-center">
        <Skeleton className="h-10 w-full sm:w-44" />
        <Skeleton className="h-10 w-full sm:w-36" />
      </div>
    );
  }

  if (actionMode === 'preview') {
    return (
      <div className="grid w-full gap-2 sm:flex sm:w-auto sm:items-center">
        {canRecreate ? (
          <AlertDialog open={isRecreateDialogOpen} onOpenChange={setIsRecreateDialogOpen}>
            <Button
              variant="outline"
              className="h-10 shadow-sm sm:min-w-44"
              disabled={isActionBusy}
              type="button"
              onClick={() => setIsRecreateDialogOpen(true)}
            >
              <HugeiconsIcon data-icon="inline-start" icon={Refresh01Icon} />
              {isRecreatingRoadmap ? 'Recreating...' : 'Recreate Roadmap'}
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-destructive/10 text-destructive">
                  <HugeiconsIcon icon={Delete02Icon} />
                </AlertDialogMedia>
                <AlertDialogTitle>Recreate this roadmap?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete the current generated roadmap and send you back to the roadmap
                  generation flow. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel variant="ghost" disabled={isActionBusy}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={isActionBusy}
                  onClick={handleConfirmRecreate}
                >
                  Recreate Roadmap
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}

        <AlertDialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
          <Button
            className="h-10 shadow-sm sm:min-w-36"
            disabled={isActionBusy}
            type="button"
            onClick={() => setIsStartDialogOpen(true)}
          >
            <HugeiconsIcon data-icon="inline-start" icon={PlayIcon} />
            {isStartingLearning ? 'Starting...' : 'Start Learning'}
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-primary/10 text-primary">
                <HugeiconsIcon icon={PlayIcon} />
              </AlertDialogMedia>
              <AlertDialogTitle>Start learning this roadmap?</AlertDialogTitle>
              <AlertDialogDescription>
                This will unlock the first group of skills and mark this roadmap as started for your
                account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel variant="ghost" disabled={isActionBusy}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction disabled={isActionBusy} onClick={handleConfirmStart}>
                Start Learning
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return null;

  // return (
  //   <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:items-center">
  //     <Button variant="outline" size="icon" className="h-10 w-full shadow-sm sm:w-10">
  //       <HugeiconsIcon className="size-4" icon={SaveIcon} />
  //     </Button>
  //     <Button variant="outline" className="h-10 shadow-sm">
  //       {!isMobile && 'Download'}
  //       <HugeiconsIcon className="ml-2 size-4" icon={Download01Icon} />
  //     </Button>
  //     <Button variant="outline" size="icon" className="h-10 w-full shadow-sm sm:w-10">
  //       <HugeiconsIcon className="size-4" icon={Share01Icon} />
  //     </Button>
  //   </div>
  // );
}
