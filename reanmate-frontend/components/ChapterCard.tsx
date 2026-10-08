"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProgress } from "@/lib/progress";
import { toKhmerNumber } from "@/lib/format";
import type { Chapter } from "@/lib/types";

export default function ChapterCard({ chapter }: { chapter: Chapter }) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadProgress().then((progress) => {
      if (!cancelled) setCompleted(Boolean(progress[chapter.id]?.completedAt));
    });
    return () => {
      cancelled = true;
    };
  }, [chapter.id]);

  return (
    <Link
      href={`/learn/${chapter.grade}/${chapter.subject}/${chapter.id}`}
      className="ui-card group overflow-hidden"
    >
      <div className="relative flex aspect-[16/8] items-end bg-primary-dark px-4 py-3">
        {completed ? (
          <span className="absolute left-4 top-4 rounded-full bg-success px-2.5 py-0.5 text-[10px] font-semibold text-white">
            បានបញ្ចប់
          </span>
        ) : null}
        <span className="absolute right-4 top-4 text-4xl text-white/12">
          {chapter.subject === "math" ? "គ" : "ប"}
        </span>
        <p className="text-xs font-semibold text-gold">មេរៀនទី{toKhmerNumber(chapter.sortOrder)}</p>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-ink group-hover:text-primary">
          {chapter.title}
        </h3>
        <p className="mt-1 text-xs text-ink-muted">
          វីដេអូ · AI · តេស្ត {toKhmerNumber(chapter.questions.length)} សំណួរ
        </p>
        <p className={`mt-3 text-sm font-semibold ${completed ? "text-success" : "text-cta"}`}>
          {completed ? "មើលម្តងទៀត →" : "ចូលរៀន →"}
        </p>
      </div>
    </Link>
  );
}
