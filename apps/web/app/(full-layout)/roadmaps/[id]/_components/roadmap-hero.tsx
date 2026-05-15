'use client';

import type { Variants } from 'framer-motion';

import {
  ArrowLeftIcon,
  Download01Icon,
  InformationCircleIcon,
  SaveIcon,
  Share01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { Button } from '@repo/design-system/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { useIsMobile } from '@/hooks/use-mobile';

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
      ease: [0.21, 0.47, 0.32, 0.98],
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export function RoadmapHero() {
  const isMobile = useIsMobile();

  return (
    <SectionContainer className="relative flex w-full flex-col justify-start pt-20 pb-6 sm:pt-24 sm:pb-8 lg:pt-32">
      <motion.div
        className="flex w-full flex-col gap-5 sm:gap-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Top Row */}
        <motion.div
          className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          variants={itemVariants}
        >
          <Link
            className="text-primary hover:text-primary-active group inline-flex items-center gap-2 self-start font-medium transition-all hover:-translate-x-1"
            href="/"
          >
            <div className="bg-primary/5 group-hover:bg-primary/10 flex size-8 items-center justify-center rounded-full transition-colors">
              <HugeiconsIcon className="size-4" icon={ArrowLeftIcon} />
            </div>
            <span>All Roadmaps</span>
          </Link>
          <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:items-center">
            <Button variant="outline" size="icon" className="h-10 w-full shadow-sm sm:w-10">
              <HugeiconsIcon className="size-4" icon={SaveIcon} />
            </Button>
            <Button variant="outline" className="h-10 shadow-sm">
              {!isMobile && 'Download'}
              <HugeiconsIcon className="ml-2 size-4" icon={Download01Icon} />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-full shadow-sm sm:w-10">
              <HugeiconsIcon className="size-4" icon={Share01Icon} />
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <motion.h1
            className="text-heading text-3xl sm:text-4xl lg:text-5xl"
            variants={itemVariants}
          >
            Frontend
          </motion.h1>
          <motion.p
            className="text-subtitle max-w-full text-sm sm:text-base"
            variants={itemVariants}
          >
            Step by step guide to becoming a modern frontend developer in 2026. Master the essential
            skills from HTML/CSS to advanced frameworks.
          </motion.p>
        </div>

        {/* Progress Row */}
        <motion.div
          className="border-primary/10 bg-primary/5 flex w-full flex-col gap-4 rounded-lg border p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative flex size-12 items-center justify-center">
              <svg className="size-full" viewBox="0 0 36 36">
                <path
                  className="stroke-primary/10"
                  fill="none"
                  strokeWidth="3"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  className="stroke-primary"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 0.05 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                  strokeLinecap="round"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="text-primary absolute text-[10px] font-bold">0%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-semibold sm:text-base">0% DONE</span>
              <span className="text-muted-foreground text-xs sm:text-sm">
                Click nodes to track your progress
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            className="text-primary hover:bg-primary/10 group h-10 w-full px-4 py-2 font-semibold shadow-sm transition-all sm:h-auto sm:w-auto"
          >
            Track Progress
            <HugeiconsIcon
              className="ml-2 size-4 transition-transform group-hover:rotate-12"
              icon={InformationCircleIcon}
            />
          </Button>
        </motion.div>
      </motion.div>
    </SectionContainer>
  );
}
