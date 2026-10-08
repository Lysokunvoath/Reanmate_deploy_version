"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getChapter } from "@/lib/api";
import { getLastVisited, type LastVisited } from "@/lib/progress";
import { toKhmerNumber } from "@/lib/format";

const SUBJECT_LABELS: Record<string, string> = {
  math: "គណិតវិទ្យា",
  history: "ប្រវត្តិវិទ្យា",
};

export default function ContinueCard() {
  const [last, setLast] = useState<LastVisited | null>(null);

  useEffect(() => {
    const visit = getLastVisited();
    if (!visit?.chapterId) {
      setLast(null);
      return;
    }
    (async () => {
      const chapter = await getChapter(visit.chapterId);
      setLast(chapter?.status === "approved" ? visit : null);
    })();
  }, []);

  if (!last?.chapterId || !last.title) return null;

  return (
    <Link
      href={`/learn/${last.grade}/${last.subject}/${last.chapterId}`}
      className="ui-card group relative flex min-h-[4.5rem] items-center justify-between gap-4 overflow-hidden py-4 pl-6 pr-5"
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-gold" />
      <div className="min-w-0">
        <p className="ui-kicker">បន្តរៀន</p>
        <p className="mt-1 text-lg font-semibold text-primary">{last.title}</p>
        <p className="text-sm text-ink-muted">
          ថ្នាក់ទី{toKhmerNumber(last.grade)} · {SUBJECT_LABELS[last.subject] ?? last.subject}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold text-cta transition-transform group-hover:translate-x-1">
        បន្ត →
      </span>
    </Link>
  );
}
