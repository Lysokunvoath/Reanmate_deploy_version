import ContinueCard from "@/components/ContinueCard";
import HomeHero from "@/components/HomeHero";
import PageTitle from "@/components/PageTitle";
import { GRADES, SUBJECTS, getApprovedChapters } from "@/lib/api";
import { toKhmerNumber } from "@/lib/format";
import Link from "next/link";

export default async function HomePage() {
  const gradeCounts = await Promise.all(
    GRADES.map(async (grade) => {
      const counts = await Promise.all(
        SUBJECTS.map(async (subject) => (await getApprovedChapters(grade, subject.id)).length),
      );
      return { grade, count: counts.reduce((sum, n) => sum + n, 0) };
    }),
  );

  return (
    <div className="flex flex-col gap-10">
      <HomeHero />
      <ContinueCard />

      <section>
        <PageTitle>ជ្រើសរើសថ្នាក់</PageTitle>
        <div className="stagger mt-6 grid gap-4 sm:grid-cols-3 sm:gap-5">
          {gradeCounts.map(({ grade, count }) => (
            <Link
              key={grade}
              href={`/learn/${grade}`}
              className="ui-card group relative overflow-hidden px-6 py-8 text-center"
            >
              <span className="absolute inset-x-8 top-0 h-px bg-gold/80" />
              {count === 0 && (
                <span className="absolute right-4 top-4 text-[10px] text-ink-muted">
                  កំពុងរៀបចំ
                </span>
              )}
              <span className="text-4xl font-bold text-primary">
                {toKhmerNumber(grade)}
              </span>
              <p className="mt-3 text-base font-semibold text-ink">
                ថ្នាក់ទី{toKhmerNumber(grade)}
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                {count > 0 ? `មេរៀនចំនួន ${toKhmerNumber(count)}` : "មេរៀននឹងមកដល់ឆាប់ៗ"}
              </p>
              <p className="mt-4 text-xs font-semibold text-cta">
                ជ្រើសមុខវិជ្ជា →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
