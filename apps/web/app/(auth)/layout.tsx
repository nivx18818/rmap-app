import { MapsIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Image from 'next/image';
import Link from 'next/link';

import { HeroGradient } from '@/components/shared/hero-gradient';
import { MaskBackground } from '@/components/shared/mask-background';
import { RainbowBar } from '@/components/shared/rainbow-bar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-background relative min-h-screen overflow-hidden">
      <MaskBackground />
      <HeroGradient className="opacity-70" />
      <RainbowBar className="opacity-70" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full">
        <section className="relative z-10 flex flex-1 flex-col px-6 pb-10 sm:px-10 lg:px-16">
          <header className="pt-6 pb-14 sm:pb-16">
            <Link className="flex w-fit items-center gap-2" href="/">
              <HugeiconsIcon className="size-8" icon={MapsIcon} />
              <span className="font-heading text-foreground text-2xl leading-none font-bold tracking-[-0.5px]">
                RMap
              </span>
            </Link>
          </header>

          {children}
        </section>

        <aside className="pointer-events-none absolute inset-0 -z-10 shrink-0 overflow-hidden opacity-50 lg:pointer-events-auto lg:relative lg:z-auto lg:block lg:w-100 lg:opacity-100 xl:w-md">
          <Image
            className="object-cover object-center"
            alt="Illustration on sign in page"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 448px"
            src="/auth-image.png"
          />

          {/* Quote overlay — visible only on desktop */}
          <div className="absolute inset-0 hidden flex-col justify-start px-16 pt-16 lg:flex">
            {/* Author block */}
            <div className="flex flex-col gap-0.5">
              <span className="font-heading text-[23px] leading-[1.3] font-medium tracking-[-0.6px] text-[#5d1985]">
                Sarah K.
              </span>
              <span className="font-heading text-[20px] leading-[1.3] font-medium tracking-[-0.6px] text-[#5d1985]/80">
                Software Engineer
              </span>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-[20px] leading-none font-medium text-[#5d1985]/50">—</span>
                <span className="font-heading text-[20px] font-medium tracking-[-0.6px] text-[#5d1985]/80 underline decoration-solid">
                  Google
                </span>
              </div>
            </div>

            {/* Quote */}
            <blockquote className="font-heading mt-6 text-[22px] leading-[1.35] font-medium tracking-[-0.5px] text-[#5d1985]">
              &ldquo;RMap turned my scattered learning into a clear, structured path. I landed my
              dream role in 4 months.&rdquo;
            </blockquote>
          </div>
        </aside>
      </div>

      <RainbowBar className="top-auto -bottom-16 -left-12 opacity-70" rotate={0} />
    </main>
  );
}
