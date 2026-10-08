"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BackLink, { overlayNav } from "@/components/BackLink";
import Mascot from "@/components/Mascot";
import PageTitle from "@/components/PageTitle";
import StudySteps from "@/components/StudySteps";
import { recordQuizResult } from "@/lib/progress";
import { ApiError, getSubject } from "@/lib/api";
import { toKhmerNumber } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";
import type { Chapter } from "@/lib/types";

const LETTERS = ["ក", "ខ", "គ", "ឃ", "ង", "ច", "ឆ", "ជ"];
const LEAVE_QUIZ = "ចាកចេញពីតេស្ត? ចម្លើយដែលឆ្លើយរួចនឹងបាត់។";

interface NextChapterInfo {
  id: string;
  title: string;
  grade: number;
  subject: string;
}

export default function QuizRunner({
  chapter,
  nextChapter,
}: {
  chapter: Chapter;
  nextChapter: NextChapterInfo | null;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [nudgeId, setNudgeId] = useState<string | null>(null);
  const toast = useToast();

  const questions = useMemo(
    () => [...chapter.questions].sort((a, b) => a.sortOrder - b.sortOrder),
    [chapter.questions],
  );

  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter(
    (q) => answers[q.id] === q.correctIndex,
  ).length;
  const scorePercent =
    questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const passed = scorePercent >= 70;
  const dirty = answeredCount > 0 && !finished;
  const leaveConfirm = dirty ? LEAVE_QUIZ : undefined;
  const studyHref = `/learn/${chapter.grade}/${chapter.subject}/${chapter.id}`;
  const subject = getSubject(chapter.subject);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest("a[href]");
      if (!link?.closest("header, footer")) return;
      if (!window.confirm(LEAVE_QUIZ)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    if (!(window.history.state as { reanmateQuiz?: number } | null)?.reanmateQuiz) {
      window.history.pushState({ ...window.history.state, reanmateQuiz: 1 }, "");
    }
    const onPop = () => {
      if (overlayNav.skipPop) {
        overlayNav.skipPop = false;
        return;
      }
      if (!window.confirm(LEAVE_QUIZ)) {
        window.history.pushState({ ...window.history.state, reanmateQuiz: 1 }, "");
        return;
      }
      window.history.back();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [dirty]);

  const select = (questionId: string, optionIndex: number) => {
    if (answers[questionId] !== undefined || finished) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const finish = () => {
    setFinished(true);
    recordQuizResult(chapter.id, answers).catch((err: unknown) => {
      toast.error(
        err instanceof ApiError && err.status === 401
          ? "សូមចូលគណនី ដើម្បីរក្សាទុកពិន្ទុរបស់អ្នក។"
          : "មិនអាចរក្សាទុកពិន្ទុបានទេ។ សូមពិនិត្យការតភ្ជាប់។",
      );
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (passed) {
      toast.success("បានរៀនចប់មេរៀននេះហើយ!");
    } else {
      toast.error("មិនទាន់គ្រប់ពិន្ទុទេ។ ត្រូវការ ៧០%។");
    }
  };

  const tryFinish = () => {
    if (answeredCount < questions.length) {
      const first = questions.find((q) => answers[q.id] === undefined);
      if (first) {
        setNudgeId(first.id);
        document
          .getElementById(`quiz-q-${first.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => setNudgeId(null), 1400);
        toast.info("សូមឆ្លើយសំណួរដែលនៅសល់សិន។");
      }
      return;
    }
    finish();
  };

  const retry = () => {
    setAnswers({});
    setFinished(false);
    window.scrollTo({ top: 0 });
  };

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const ringOffset = circumference - (scorePercent / 100) * circumference;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={studyHref} label="ត្រឡប់ទៅមេរៀន" confirmMessage={leaveConfirm} />

      <div>
        <PageTitle>តេស្ត — {chapter.title}</PageTitle>
        <p className="mt-2 text-sm text-ink-muted">
          {subject.nameKm} · ថ្នាក់ទី{toKhmerNumber(chapter.grade)}
        </p>
      </div>

      <StudySteps current={3} studyHref={studyHref} leaveConfirm={leaveConfirm} />

      {finished ? (
        <div
          className={`score-pop ui-card p-8 text-center ${passed ? "ring-1 ring-success/20" : ""}`}
        >
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary-dark">
            <Mascot size={52} onDark />
          </div>
          <div className="relative mx-auto mb-3 h-24 w-24">
            <svg viewBox="0 0 96 96" className="h-24 w-24">
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke="#e7f2f1"
                strokeWidth="7"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke={passed ? "#2a8a45" : "#e05656"}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={ringOffset}
                className="ring-draw"
              />
            </svg>
            <p className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
              {toKhmerNumber(scorePercent)}%
            </p>
          </div>
          <p className="text-2xl font-bold text-primary">
            {toKhmerNumber(correctCount)}/{toKhmerNumber(questions.length)}
          </p>
          {passed ? (
            <>
              <p className="mt-3 text-lg font-semibold text-success">
                បានរៀនចប់មេរៀននេះហើយ!
              </p>
              <p className="mt-1 text-sm text-ink-muted">ពិន្ទុឆ្លងគឺ ៧០% ឡើងទៅ</p>
              {nextChapter ? (
                <Link
                  href={`/learn/${nextChapter.grade}/${nextChapter.subject}/${nextChapter.id}`}
                  className="ui-btn mt-5 inline-flex min-h-11 max-w-full items-center justify-center break-words rounded-xl bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary-dark"
                >
                  មេរៀនបន្ទាប់៖ {nextChapter.title} →
                </Link>
              ) : (
                <Link
                  href={`/learn/${chapter.grade}/${chapter.subject}`}
                  className="ui-btn mt-5 inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary-dark"
                >
                  ត្រឡប់ទៅបញ្ជីមេរៀន
                </Link>
              )}
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-bold text-error">
                មិនទាន់គ្រប់ពិន្ទុទេ
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                ត្រូវការ ៧០%។ អានការពន្យល់ម្ដងទៀត រួចសាកម្តងទៀត
              </p>
              <button
                type="button"
                onClick={retry}
                className="ui-btn mt-5 inline-flex min-h-11 items-center rounded-xl bg-cta px-6 py-2.5 font-semibold text-white hover:bg-cta-dark"
              >
                ព្យាយាមម្តងទៀត
              </button>
              <div>
                <Link
                  href={studyHref}
                  className="ui-btn mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
                >
                  ← ត្រឡប់ទៅមេរៀន
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 px-1 text-sm" id="quiz-start">
          <p className="text-ink-muted">
            បានឆ្លើយ {toKhmerNumber(answeredCount)}/{toKhmerNumber(questions.length)}
          </p>
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="bar-fill h-full rounded-full"
              style={{
                width: `${
                  questions.length
                    ? Math.round((answeredCount / questions.length) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {finished ? (
        <p className="px-1 text-sm font-semibold text-primary">ពិនិត្យចម្លើយ</p>
      ) : null}

      {questions.map((question, qIndex) => {
        const selected = answers[question.id];
        const isAnswered = selected !== undefined;

        return (
          <div
            key={question.id}
            id={`quiz-q-${question.id}`}
            className={`ui-card p-4 sm:p-5 ${nudgeId === question.id ? "ring-2 ring-cta" : ""}`}
          >
            <p className="font-bold">
              {toKhmerNumber(qIndex + 1)}. {question.prompt}
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {question.options.map((option, optionIndex) => {
                const isCorrect = optionIndex === question.correctIndex;
                const isSelected = selected === optionIndex;

                let style = "border-line bg-surface hover:border-primary";
                if (isAnswered) {
                  if (isCorrect) style = "border-success bg-success-soft";
                  else if (isSelected) style = "border-error bg-error-soft";
                  else style = "border-line bg-surface opacity-60";
                }

                return (
                  <button
                    key={optionIndex}
                    type="button"
                    onClick={() => select(question.id, optionIndex)}
                    disabled={isAnswered}
                    className={`flex min-h-11 items-start gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[15px] transition-all duration-200 ${style} ${isSelected ? "opt-pick" : ""}`}
                  >
                    <span
                      className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                        isAnswered && isCorrect
                          ? "bg-success text-white"
                          : isAnswered && isSelected
                            ? "bg-error text-white"
                            : "bg-primary-light text-primary"
                      }`}
                    >
                      {LETTERS[optionIndex] ?? toKhmerNumber(optionIndex + 1)}
                    </span>
                    <span className="min-w-0 flex-1 pt-0.5">
                      {option}
                      {isAnswered && isCorrect ? (
                        <span className="ml-2 font-bold text-success">✓</span>
                      ) : null}
                      {isAnswered && isSelected && !isCorrect ? (
                        <span className="ml-2 font-bold text-error">✗</span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>

            {isAnswered ? (
              <div className="msg-in mt-4 rounded-xl bg-primary-light p-4 text-sm">
                <p className="font-bold text-primary">ការពន្យល់</p>
                <p className="mt-1">{question.explanation}</p>
              </div>
            ) : null}
          </div>
        );
      })}

      {!finished ? (
        <div className="sticky bottom-3 z-20 -mx-1 bg-gradient-to-t from-bg via-bg to-transparent px-1 pt-8 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={tryFinish}
            className={`ui-btn min-h-12 w-full rounded-xl bg-cta py-3.5 text-base font-semibold text-white shadow-[0_8px_24px_rgba(224,86,86,0.28)] hover:bg-cta-dark ${
              answeredCount < questions.length ? "opacity-80" : ""
            }`}
          >
            {answeredCount < questions.length
              ? `សូមឆ្លើយសំណួរទាំងអស់ (${toKhmerNumber(answeredCount)}/${toKhmerNumber(questions.length)})`
              : "បញ្ចប់តេស្ត"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
