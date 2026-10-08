import BackLink from "@/components/BackLink";
import ChapterEditor from "@/components/ChapterEditor";
import PageTitle from "@/components/PageTitle";

export default function NewChapterPage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl">
        <BackLink href="/admin" label="ត្រឡប់ទៅបញ្ជីមេរៀន" />
      </div>
      <PageTitle className="mx-auto mt-3 max-w-3xl">បង្កើតមេរៀនថ្មី</PageTitle>
      <div className="mt-6">
        <ChapterEditor chapter={null} />
      </div>
    </div>
  );
}
