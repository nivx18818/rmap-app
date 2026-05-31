import type { ReactNode } from 'react';

import { ArrowLeftIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { itemVariants } from '../_utils/roadmap-hero-utils';

export interface HeroHeaderProps {
  heroActions: ReactNode;
  heroDescription: string;
  isLoading: boolean;
  title: string;
}

export function HeroHeader({ heroActions, heroDescription, isLoading, title }: HeroHeaderProps) {
  return (
    <>
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
        <div className="hidden sm:block">{heroActions}</div>
      </motion.div>

      <div className="flex flex-col gap-3 sm:gap-4">
        <motion.h1
          className="text-heading text-2xl sm:text-4xl lg:text-[42px]"
          variants={itemVariants}
        >
          {isLoading ? 'Loading roadmap...' : title}
        </motion.h1>
        <motion.p className="text-subtitle max-w-full text-sm sm:text-base" variants={itemVariants}>
          {heroDescription}
        </motion.p>
        <div className="sm:hidden">{heroActions}</div>
      </div>
    </>
  );
}
