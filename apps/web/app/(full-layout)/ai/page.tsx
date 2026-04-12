import { ArrowRight, FlaskConical } from '@hugeicons/core-free-icons';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { Button } from '@repo/design-system/components/ui/button';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@repo/design-system/components/ui/field';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import Image from 'next/image';

import { ChatInput, ChatLoading, ChatMessage } from '@/components/ai/chat-message';
import { HeroGradient } from '@/components/landing/ui/hero-gradient';
import { MaskBackground } from '@/components/landing/ui/mask-background';
import { RainbowBar } from '@/components/landing/ui/rainbow-bar';

export default function AiRoadmapPage() {
  return (
    <section className="relative flex min-h-screen items-center justify-center py-32">
      <Image
        className="pointer-events-none absolute top-0 left-0 h-auto w-full object-cover opacity-70 sm:opacity-100"
        src="/ai-image.png"
        alt="AI roadmap illustration"
        sizes="100vw"
        width={1304}
        height={809}
      />
      <MaskBackground />
      <HeroGradient />
      <RainbowBar />

      <SectionContainer className="relative z-10 flex h-full w-full flex-col items-center justify-center">
        <div className="md:border-background/30 md:bg-background/60 flex w-full max-w-4xl flex-col gap-6 md:rounded-3xl md:border md:px-6 md:py-8 md:shadow-sm md:backdrop-blur-sm lg:px-10 lg:py-10">
          {/* Heading */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-foreground text-3xl leading-tight font-medium tracking-[-0.8px] sm:text-4xl sm:tracking-[-1px]">
              What can I help you learn?
            </h2>
            <p className="text-muted-foreground max-w-2xl text-base leading-[1.7] sm:text-lg">
              Enter a topic below to generate a personalized roadmap for it.
            </p>
          </div>

          {/* Form */}
          <FieldGroup className="flex flex-col gap-5 sm:gap-6">
            <Field>
              <FieldLabel className="text-base font-normal" htmlFor="topic">
                What can I help you learn?
              </FieldLabel>
              <Input
                id="topic"
                name="topic"
                placeholder="Enter any topic that you want to learn"
                type="text"
                autoComplete="topic"
              />
            </Field>
            <Field orientation="horizontal">
              <Checkbox id="questions-checkbox" name="questions-checkbox" />
              <Label className="text-sm font-normal sm:text-base" htmlFor="questions-checkbox">
                Answer the following questions for a better roadmap
              </Label>
            </Field>

            {/* Personalized Questions Form */}
            <div className="border-border relative flex h-120 w-full flex-col items-center justify-center overflow-hidden rounded-xl border p-3 shadow-[inset_0_1px_3px_rgba(139,92,246,0.08)] backdrop-blur-xs transition-all sm:h-136 sm:p-4">
              <div className="scrollbar-thin flex w-full flex-1 flex-col gap-5 overflow-y-auto pr-1.5 pb-3 sm:gap-6 sm:pr-2 sm:pb-4">
                <ChatMessage
                  role="ai"
                  content="What is your primary goal for learning prompt engineering?"
                />
                <ChatMessage role="user" content="Automating tasks or workflows" />
                <ChatMessage
                  role="ai"
                  content="Which AI models or platforms are you most interested in mastering?"
                  options={['Open AI', 'Claude AI', 'Google Gemini', 'Meta Llama', 'Other']}
                />
                <ChatLoading />
              </div>

              <ChatInput />
            </div>
            <Button size="lg" className="group/btn w-full" type="submit">
              Generate Roadmap
              <AnimatedIconSwap icon={ArrowRight} hoverIcon={FlaskConical} />
            </Button>
          </FieldGroup>
        </div>
      </SectionContainer>
    </section>
  );
}
