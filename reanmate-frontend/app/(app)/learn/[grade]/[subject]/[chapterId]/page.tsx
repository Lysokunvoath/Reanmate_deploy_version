import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink";
import Breadcrumb from "@/components/Breadcrumb";
import ChapterStudy from "@/components/ChapterStudy";
import PageTitle from "@/components/PageTitle";
import { getChapter, getSubject } from "@/lib/api";
import { toKhmerNumber } from "@/lib/format";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ grade: string; subject: string; chapterId: string }>;
}) {
  const { chapterId } = await params;
  const chapter = await getChapter(chapterId);
  if (!chapter || chapter.status !== "approved") notFound();

  const subject = getSubject(chapter.subject);

  return (
    <div>
      <BackLink
        href={`/learn/${chapter.grade}/${chapter.subject}`}
        label={`ត្រឡប់ទៅ${subject.nameKm}`}
      />
      <div className="mt-1 hidden sm:block">
        <Breadcrumb
          items={[
            { href: "/home", label: "ទំព័រដើម" },
            {
              href: `/learn/${chapter.grade}`,
              label: `ថ្នាក់ទី${toKhmerNumber(chapter.grade)}`,
            },
            {
              href: `/learn/${chapter.grade}/${chapter.subject}`,
              label: subject.nameKm,
            },
            { label: chapter.title },
          ]}
        />
      </div>

      <PageTitle className="mt-4">
        មេរៀនទី{toKhmerNumber(chapter.sortOrder)} — {chapter.title}
      </PageTitle>

      <div className="mt-5">
        <ChapterStudy chapter={chapter} />
      </div>
    </div>
  );
}
