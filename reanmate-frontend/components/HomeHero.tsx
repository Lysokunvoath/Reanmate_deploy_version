"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Mascot from "@/components/Mascot";
import { loadProgress } from "@/lib/progress";
import { toKhmerNumber } from "@/lib/format";

const DEMO_HREF = "/learn/10/math/g10-math-c1";

export default function HomeHero() {
  const [completed, setCompleted] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadProgress().then((progress) => {
      if (cancelled) return;
      setCompleted(Object.values(progress).filter((item) => item.completedAt).length);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="hero-shine relative overflow-hidden rounded-[1.25rem] bg-primary-dark text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_right,_rgba(196,163,90,0.16),_transparent_60%)]"
      />
      <div className="relative flex items-center gap-5 p-6 sm:gap-8 sm:p-8">
        <Mascot size={72} onDark className="mascot-bob hidden shrink-0 min-[400px]:block" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="ui-kicker">សួស្តី</p>
            {ready && completed > 0 ? (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/65">
                បានបញ្ចប់ {toKhmerNumber(completed)}
              </span>
            ) : null}
          </div>
          <h1 className="mt-1 text-xl font-bold leading-snug sm:text-2xl">
            រៀនជាមួយ ReanMate
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/70">
            {ready && completed > 0
              ? `បានរៀនចប់មេរៀន ${toKhmerNumber(completed)} ហើយ។ បន្តមេរៀនបន្ទាប់បាន។`
              : "មើលវីដេអូ សួរ AI បើមិនយល់ រួចធ្វើតេស្ត។ ចាប់ផ្ដើមពីថ្នាក់ទី១០។"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/55">
            <span className="rounded-full bg-white/10 px-2.5 py-1">០១ មើលវីដេអូ</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1">០២ សួរ AI</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1">០៣ ធ្វើតេស្ត</span>
          </div>
          <Link
            href={DEMO_HREF}
            className="ui-btn mt-5 inline-flex min-h-11 items-center rounded-xl bg-cta px-5 py-2 text-sm font-semibold text-white hover:bg-cta-dark"
          >
            សាកល្បងមេរៀន · អនុគមន៍
          </Link>
        </div>
      </div>
    </section>
  );
}
