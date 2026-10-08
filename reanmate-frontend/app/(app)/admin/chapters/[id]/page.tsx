"use client";

import { useParams } from "next/navigation";
import BackLink from "@/components/BackLink";
import ChapterEditor from "@/components/ChapterEditor";
import EmptyState from "@/components/EmptyState";
import PageTitle from "@/components/PageTitle";
import { getAdminChapter } from "@/lib/api";
import { useAdminLoad } from "@/lib/useAdminLoad";

export default function EditChapterPage() {
  const { id } = useParams<{ id: string }>();
  const { data: chapter, error } = useAdminLoad(() => getAdminChapter(id), [id]);

  if (error) {
    return (
      <EmptyState
        title={error.status === 404 ? "រកមិនឃើញមេរៀន" : "មិនអាចផ្ទុកមេរៀនបានទេ"}
        body={error.message}
        actionHref="/admin"
        actionLabel="ត្រឡប់ទៅបញ្ជីមេរៀន"
      />
    );
  }
  if (!chapter) {
    return <p className="py-14 text-center text-sm text-ink-muted">កំពុងផ្ទុក…</p>;
  }

  return (
    <div>
      <div className="mx-auto max-w-3xl">
        <BackLink href="/admin" label="ត្រឡប់ទៅបញ្ជីមេរៀន" />
      </div>
      <PageTitle className="mx-auto mt-3 max-w-3xl">
        កែសម្រួលមេរៀន — {chapter.title}
      </PageTitle>
      <div className="mt-6">
        <ChapterEditor chapter={chapter} />
      </div>
    </div>
  );
}
