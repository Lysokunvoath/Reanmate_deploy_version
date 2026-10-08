"use client";

import Link from "next/link";
import BackLink from "@/components/BackLink";
import EmptyState from "@/components/EmptyState";
import PageTitle from "@/components/PageTitle";
import { getAllChapters, getSubject } from "@/lib/api";
import { toKhmerNumber } from "@/lib/format";
import { useAdminLoad } from "@/lib/useAdminLoad";

export default function AdminPage() {
  const { data, error } = useAdminLoad(getAllChapters);

  if (error) {
    return (
      <EmptyState
        title="មិនអាចផ្ទុកមេរៀនបានទេ"
        body={error.message}
        actionHref="/home"
        actionLabel="ត្រឡប់ទៅទំព័រដើម"
      />
    );
  }
  if (!data) {
    return <p className="py-14 text-center text-sm text-ink-muted">កំពុងផ្ទុក…</p>;
  }

  const chapters = data;
  const approved = chapters.filter((c) => c.status === "approved").length;
  const drafts = chapters.length - approved;

  return (
    <div>
      <BackLink href="/home" label="ត្រឡប់ទៅទំព័រដើម" />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <PageTitle className="sm:min-w-0 sm:flex-1">ផ្ទាំងគ្រប់គ្រង — មេរៀនទាំងអស់</PageTitle>
        <Link
          href="/admin/chapters/new"
          className="ui-btn inline-flex min-h-11 items-center justify-center rounded-xl bg-cta px-5 py-2.5 text-center font-semibold text-white hover:bg-cta-dark"
        >
          + បង្កើតមេរៀនថ្មី
        </Link>
      </div>

      <div className="stagger mt-6 grid grid-cols-3 gap-3">
        <div className="ui-card px-4 py-4 text-center">
          <p className="text-2xl font-bold text-primary">{toKhmerNumber(chapters.length)}</p>
          <p className="mt-1 text-xs text-ink-muted">មេរៀនទាំងអស់</p>
        </div>
        <div className="ui-card px-4 py-4 text-center">
          <p className="text-2xl font-bold text-success">{toKhmerNumber(approved)}</p>
          <p className="mt-1 text-xs text-ink-muted">បានអនុម័ត</p>
        </div>
        <div className="ui-card px-4 py-4 text-center">
          <p className="text-2xl font-bold text-cta">{toKhmerNumber(drafts)}</p>
          <p className="mt-1 text-xs text-ink-muted">ព្រាង</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 md:hidden">
        {chapters.map((chapter) => (
          <Link
            key={chapter.id}
            href={`/admin/chapters/${chapter.id}`}
            className="ui-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-ink">{chapter.title}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  ថ្នាក់ទី{toKhmerNumber(chapter.grade)} ·{" "}
                  {getSubject(chapter.subject).nameKm} · សំណួរ{" "}
                  {toKhmerNumber(chapter.questions.length)}
                </p>
              </div>
              {chapter.status === "approved" ? (
                <span className="shrink-0 rounded-full bg-success-soft px-3 py-1 text-xs font-bold text-success">
                  បានអនុម័ត
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-section px-3 py-1 text-xs font-bold text-cta">
                  ព្រាង
                </span>
              )}
            </div>
            <p className="mt-3 text-sm font-medium text-primary">កែសម្រួល →</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-primary-dark text-left text-white">
              <th className="px-4 py-3 font-medium">ថ្នាក់</th>
              <th className="px-4 py-3 font-medium">មុខវិជ្ជា</th>
              <th className="px-4 py-3 font-medium">មេរៀន</th>
              <th className="px-4 py-3 font-medium">សំណួរ</th>
              <th className="px-4 py-3 font-medium">ស្ថានភាព</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {chapters.map((chapter) => (
              <tr
                key={chapter.id}
                className="border-t border-line transition-colors hover:bg-primary-light/60"
              >
                <td className="px-4 py-3">ទី{toKhmerNumber(chapter.grade)}</td>
                <td className="px-4 py-3">{getSubject(chapter.subject).nameKm}</td>
                <td className="px-4 py-3 font-medium">{chapter.title}</td>
                <td className="px-4 py-3">{toKhmerNumber(chapter.questions.length)}</td>
                <td className="px-4 py-3">
                  {chapter.status === "approved" ? (
                    <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-bold text-success">
                      បានអនុម័ត
                    </span>
                  ) : (
                    <span className="rounded-full bg-section px-3 py-1 text-xs font-bold text-cta">
                      ព្រាង
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/chapters/${chapter.id}`}
                    className="inline-flex min-h-11 items-center font-medium text-primary hover:underline"
                  >
                    កែសម្រួល
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-ink-muted">
        គោលដៅ៖ ៣ មេរៀន × ២ មុខវិជ្ជា × ៣ ថ្នាក់ = ១៨ មេរៀន។ សិស្សឃើញតែមេរៀនដែល
        «បានអនុម័ត» ប៉ុណ្ណោះ។
      </p>
    </div>
  );
}
