import { notFound } from "next/navigation";
import QuizRunner from "@/components/QuizRunner";
import { getChapter, getNextChapter } from "@/lib/api";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ grade: string; subject: string; chapterId: string }>;
}) {
  const { chapterId } = await params;
  const chapter = await getChapter(chapterId);
  if (!chapter || chapter.status !== "approved") notFound();

  const next = await getNextChapter(chapter);

  return (
    <div className="mx-auto max-w-3xl">
      <QuizRunner
        chapter={chapter}
        nextChapter={
          next
            ? {
                id: next.id,
                title: next.title,
                grade: next.grade,
                subject: next.subject,
              }
            : null
        }
      />
    </div>
  );
}
