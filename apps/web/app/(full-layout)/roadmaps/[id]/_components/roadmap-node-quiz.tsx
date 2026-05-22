'use client';

import type { Route } from 'next';
import type { ReactNode } from 'react';

import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { Separator } from '@repo/design-system/components/ui/separator';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { cn } from '@repo/design-system/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { roadmapService } from '@/services/roadmap.service';

import type { RoadmapNodeDetail } from '../_types/roadmap-node-detail.types';
import type {
  RoadmapNodeQuiz as RoadmapNodeQuizData,
  RoadmapNodeQuizAnswers,
  SubmitRoadmapNodeQuizResult,
} from '../_types/roadmap-node-quiz.types';

import { NODE_TYPE_LABELS, STATUS_LABELS } from '../_constants/roadmap-node.constants';
import { statusBadgeClasses } from '../_constants/roadmap-stack-list.constants';
import { isSkillNodeType } from '../_utils/roadmap-node.utils';

interface RoadmapNodeQuizProps {
  nodeId: string;
  roadmapId: string;
}

const QUIZ_LOAD_ERROR_MESSAGE = 'Unable to load this quiz.';
const QUIZ_SUBMIT_ERROR_MESSAGE = 'Unable to submit this quiz. Please try again.';

function RoadmapNodeQuizSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-5 w-96 max-w-full" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-36 w-full" />
        ))}
      </div>
    </div>
  );
}

function RoadmapNodeQuizMessage({
  badge,
  message,
  title,
}: {
  badge?: ReactNode;
  message: string;
  title: string;
}) {
  return (
    <div className="border-border bg-background flex flex-col gap-3 rounded-lg border p-6 shadow-sm">
      {badge}
      <h1 className="font-heading text-foreground text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

export function RoadmapNodeQuiz({ nodeId, roadmapId }: RoadmapNodeQuizProps) {
  const [nodeDetail, setNodeDetail] = useState<RoadmapNodeDetail | null>(null);
  const [quiz, setQuiz] = useState<RoadmapNodeQuizData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<RoadmapNodeQuizAnswers>({});
  const [submitResult, setSubmitResult] = useState<SubmitRoadmapNodeQuizResult | null>(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const roadmapHref = `/roadmaps/${roadmapId}?nodeId=${nodeId}` as Route<string>;
  const status = nodeDetail?.progress?.status ?? 'LOCKED';
  const isSkillNode = nodeDetail ? isSkillNodeType(nodeDetail.nodeType) : false;
  const answeredCount = quiz
    ? quiz.questions.filter((question) => Boolean(answers[question.id])).length
    : 0;
  const canSubmit = Boolean(quiz && answeredCount === quiz.questions.length && !isSubmitting);

  useEffect(() => {
    let isCancelled = false;

    async function loadQuiz() {
      setIsLoading(true);
      setNodeDetail(null);
      setQuiz(null);
      setAnswers({});
      setSubmitResult(null);
      setFormError(null);
      setLoadErrorMessage(null);

      try {
        const detail = await roadmapService.getNodeDetail(roadmapId, nodeId);

        if (isCancelled) return;

        setNodeDetail(detail);

        const detailStatus = detail.progress?.status ?? 'LOCKED';
        if (!isSkillNodeType(detail.nodeType) || detailStatus !== 'IN_PROGRESS') return;

        const quizResponse = await roadmapService.getNodeQuiz(roadmapId, nodeId);

        if (isCancelled) return;

        setQuiz(quizResponse);
      } catch {
        if (isCancelled) return;

        setLoadErrorMessage(QUIZ_LOAD_ERROR_MESSAGE);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    void loadQuiz();

    return () => {
      isCancelled = true;
    };
  }, [nodeId, roadmapId]);

  const handleSubmit = async () => {
    if (!nodeDetail || !quiz) return;

    if (!canSubmit) {
      setFormError('Answer all questions before submitting.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const result = await roadmapService.submitNodeQuiz(roadmapId, nodeId, answers);
      setSubmitResult(result);
      setNodeDetail((currentNodeDetail) =>
        currentNodeDetail ? { ...currentNodeDetail, progress: result.nodeProgress } : null,
      );
    } catch {
      setFormError(QUIZ_SUBMIT_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen pt-28 pb-16">
      <SectionContainer className="relative z-10 flex flex-col gap-6">
        <Button
          variant="link"
          className="w-fit px-0"
          render={<Link href={roadmapHref}>Back to roadmap</Link>}
        />

        {isLoading ? (
          <RoadmapNodeQuizSkeleton />
        ) : loadErrorMessage ? (
          <RoadmapNodeQuizMessage title="Quiz unavailable" message={loadErrorMessage} />
        ) : !nodeDetail ? (
          <RoadmapNodeQuizMessage
            title="Quiz unavailable"
            message="Select a valid roadmap node to take a quiz."
          />
        ) : !isSkillNode ? (
          <RoadmapNodeQuizMessage
            title="Quiz unavailable"
            badge={
              <Badge variant="secondary" className="w-fit">
                {NODE_TYPE_LABELS[nodeDetail.nodeType]}
              </Badge>
            }
            message="Quizzes are only available for required and optional skill nodes."
          />
        ) : status !== 'IN_PROGRESS' ? (
          <RoadmapNodeQuizMessage
            title="Quiz unavailable"
            badge={
              <Badge variant="outline" className={cn('w-fit', statusBadgeClasses[status])}>
                {STATUS_LABELS[status]}
              </Badge>
            }
            message="This quiz is available once the node is in progress."
          />
        ) : quiz ? (
          <div className="flex flex-col gap-6">
            <div className="border-border bg-background flex flex-col gap-3 rounded-lg border p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Quiz</Badge>
                <Badge variant="outline" className={statusBadgeClasses[status]}>
                  {STATUS_LABELS[status]}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="font-heading text-foreground text-3xl font-semibold">
                  {nodeDetail.name} quiz
                </h1>
                <p className="text-muted-foreground text-sm leading-6">
                  Answer all {quiz.questions.length} questions. A score of 60% or higher saves your
                  passing result and enables completion in the roadmap drawer.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {quiz.questions.map((question, index) => {
                const questionResult = submitResult?.results.find(
                  (result) => result.questionId === question.id,
                );

                return (
                  <fieldset
                    key={question.id}
                    className="border-border bg-background flex flex-col gap-3 rounded-lg border p-4 shadow-sm"
                  >
                    <legend className="text-foreground px-1 text-sm font-semibold">
                      {index + 1}. {question.questionText}
                    </legend>
                    <div className="flex flex-col gap-2">
                      {question.options.map((option) => {
                        const isSelected = answers[question.id] === option.value;
                        const correctOption = questionResult?.correctOption;
                        const isCorrectOption = Boolean(
                          correctOption && option.value === correctOption,
                        );
                        const isSelectedWrong = Boolean(
                          questionResult && isSelected && !questionResult.isCorrect,
                        );

                        return (
                          <label
                            key={option.value}
                            className={cn(
                              'border-border hover:bg-muted/50 flex cursor-pointer gap-3 rounded-md border p-3 text-sm transition-colors',
                              isSelected && 'border-primary bg-primary/10 text-primary',
                              isCorrectOption && 'border-chart-2 bg-chart-2/10 text-foreground',
                              isSelectedWrong &&
                                'border-destructive bg-destructive/10 text-foreground',
                            )}
                          >
                            <input
                              name={question.id}
                              className="sr-only"
                              type="radio"
                              value={option.value}
                              checked={isSelected}
                              onChange={() => {
                                setAnswers((currentAnswers) => ({
                                  ...currentAnswers,
                                  [question.id]: option.value,
                                }));
                              }}
                            />
                            <span className="font-medium">{option.label}</span>
                            <span>{option.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </div>

            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}

            {submitResult ? (
              <div className="border-border bg-background flex flex-col gap-3 rounded-lg border p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={submitResult.passed ? 'secondary' : 'destructive'}>
                    {submitResult.passed ? 'Passed' : 'Review needed'}
                  </Badge>
                  <Badge variant="outline">{submitResult.scorePct}%</Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {submitResult.correctCount} of {submitResult.totalQuestions} answers were correct.
                </p>
                {submitResult.suggestion ? (
                  <p className="text-muted-foreground text-sm">{submitResult.suggestion}</p>
                ) : null}
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Button render={<Link href={roadmapHref}>Return to roadmap</Link>} />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setAnswers({});
                      setSubmitResult(null);
                      setFormError(null);
                    }}
                  >
                    Retake quiz
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
                {isSubmitting ? 'Submitting...' : 'Submit quiz'}
              </Button>
              <Button variant="outline" render={<Link href={roadmapHref}>Cancel</Link>} />
            </div>
          </div>
        ) : (
          <RoadmapNodeQuizMessage
            title="Quiz unavailable"
            message="No quiz questions are available for this node yet."
          />
        )}
      </SectionContainer>
    </main>
  );
}
