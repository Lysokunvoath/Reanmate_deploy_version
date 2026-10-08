"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { overlayNav } from "@/components/BackLink";
import type { MouseEvent } from "react";

const STEPS = [
  { n: "០១", label: "មើលវីដេអូ" },
  { n: "០២", label: "សួរ AI" },
  { n: "០៣", label: "ធ្វើតេស្ត" },
] as const;

export default function StudySteps({
  current,
  studyHref,
  quizHref,
  onAsk,
  leaveConfirm,
}: {
  current: 1 | 2 | 3;
  studyHref?: string;
  quizHref?: string;
  onAsk?: () => void;
  leaveConfirm?: string;
}) {
  const router = useRouter();

  const go = (href: string) => (event: MouseEvent) => {
    if (leaveConfirm && !window.confirm(leaveConfirm)) {
      event.preventDefault();
      return;
    }
    if (leaveConfirm) {
      event.preventDefault();
      overlayNav.skipPop = true;
      router.replace(href);
    }
  };
  return (
    <ol className="grid grid-cols-3 overflow-hidden rounded-2xl border border-line bg-surface">
      {STEPS.map((step, index) => {
        const n = (index + 1) as 1 | 2 | 3;
        const active = n === current;
        const done = n < current;
        const className = `flex min-h-[3.25rem] w-full cursor-pointer flex-col items-center justify-center px-2 py-3 text-center transition-colors duration-300 ${
          active ? "step-active bg-primary text-white" : "text-ink-muted hover:bg-primary-light/50"
        } ${index > 0 ? "border-l border-line/80" : ""}`;

        const inner = (
          <>
            <span
              className={`text-[11px] font-semibold transition-colors ${active ? "text-gold" : "text-gold/70"}`}
            >
              {done ? "✓" : step.n}
            </span>
            <span className={`mt-1 text-xs font-semibold ${active ? "text-white" : "text-ink"}`}>
              {step.label}
            </span>
          </>
        );

        if (!active && n === 1 && studyHref) {
          return (
            <li key={step.n}>
              <Link href={studyHref} className={className} onClick={go(studyHref)}>
                {inner}
              </Link>
            </li>
          );
        }

        if (!active && n === 2 && onAsk) {
          return (
            <li key={step.n}>
              <button type="button" onClick={onAsk} className={className}>
                {inner}
              </button>
            </li>
          );
        }

        if (!active && n === 2 && studyHref) {
          return (
            <li key={step.n}>
              <Link href={`${studyHref}#ask-ai`} className={className} onClick={go(`${studyHref}#ask-ai`)}>
                {inner}
              </Link>
            </li>
          );
        }

        if (!active && n === 3 && quizHref) {
          return (
            <li key={step.n}>
              <Link href={quizHref} className={className} onClick={go(quizHref)}>
                {inner}
              </Link>
            </li>
          );
        }

        return (
          <li key={step.n}>
            <button
              type="button"
              className={className}
              onClick={() => {
                if (n === 1) {
                  document
                    .getElementById("lesson-video")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                } else if (n === 2) {
                  onAsk?.();
                } else {
                  document
                    .getElementById("quiz-start")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
            >
              {inner}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
