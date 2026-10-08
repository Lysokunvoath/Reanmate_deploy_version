"use client";

import { useState } from "react";
import {
  createChapter,
  generateChapterContent,
  updateChapter,
  type ChapterInput,
} from "@/lib/api";
import { toKhmerNumber } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";
import type { Chapter, Grade, SubjectId } from "@/lib/types";

interface EditableQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/**
 * Single long-form editor: metadata → MoEYS → source text → Generate →
 * review summary/MCQs → approve. A new chapter is created on its first save
 * (or first Generate, which needs the source text stored on the backend).
 */
export default function ChapterEditor({ chapter }: { chapter: Chapter | null }) {
  const [chapterId, setChapterId] = useState<string | null>(chapter?.id ?? null);
  const [grade, setGrade] = useState(chapter?.grade ?? 10);
  const [subject, setSubject] = useState<SubjectId>(chapter?.subject ?? "math");
  const [title, setTitle] = useState(chapter?.title ?? "");
  const [sortOrder, setSortOrder] = useState(chapter?.sortOrder ?? 1);
  const [embedUrl, setEmbedUrl] = useState(chapter?.moeysEmbedUrl ?? "");
  const [credit, setCredit] = useState(
    chapter?.moeysCredit ??
      "វីដេអូមេរៀនផលិតដោយ ក្រសួងអប់រំ យុវជន និងកីឡា (MoEYS)។ ខ្លឹមសារដើមជាកម្មសិទ្ធិរបស់ក្រសួង។",
  );
  const [sourceText, setSourceText] = useState(chapter?.sourceText ?? "");
  const [summary, setSummary] = useState(chapter?.summary ?? "");
  const [questions, setQuestions] = useState<EditableQuestion[]>(
    chapter?.questions.map((q) => ({
      prompt: q.prompt,
      options: [...q.options],
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    })) ?? [],
  );
  const [status, setStatus] = useState(chapter?.status ?? "draft");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fields = (): Omit<ChapterInput, "status"> => ({
    grade,
    subject,
    title: title.trim(),
    sortOrder,
    summary,
    sourceText,
    moeysEmbedUrl: embedUrl.trim(),
    moeysCredit: credit,
    questions,
  });

  /** Creates the chapter on first save and moves the URL to its edit page. */
  const createDraft = async (input: ChapterInput): Promise<string> => {
    const created = await createChapter(input);
    setChapterId(created.id);
    window.history.replaceState(null, "", `/admin/chapters/${created.id}`);
    return created.id;
  };

  const generate = async () => {
    if (generating) {
      toast.info("កំពុងបង្កើត…");
      return;
    }
    if (!sourceText.trim()) {
      toast.error("សូមបិទភ្ជាប់អត្ថបទប្រភពជាមុនសិន។");
      document.getElementById("source-text")?.focus();
      return;
    }
    if (!chapterId && !title.trim()) {
      toast.error("សូមបញ្ចូលចំណងជើងមេរៀនជាមុនសិន។");
      return;
    }
    setGenerating(true);
    try {
      // Generate reads the stored sourceText, so persist it first. Only the
      // source text is patched so an approved chapter isn't half-published.
      const id = chapterId
        ? (await updateChapter(chapterId, { sourceText }), chapterId)
        : await createDraft({ ...fields(), status: "draft" });
      const generated = await generateChapterContent(id);
      setSummary(generated.summary);
      setQuestions(generated.questions.map((q) => ({ ...q, options: [...q.options] })));
      toast.success("បានបង្កើតសង្ខេប និងសំណួរ។ សូមពិនិត្យ រួចរក្សាទុក។");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI មិនអាចបង្កើតបានទេ។");
    } finally {
      setGenerating(false);
    }
  };

  const updateQuestion = (
    index: number,
    patch: Partial<EditableQuestion>,
  ): void => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );
  };

  const save = async (nextStatus: "draft" | "approved") => {
    if (saving) return;
    if (!title.trim()) {
      toast.error("សូមបញ្ចូលចំណងជើងមេរៀនជាមុនសិន។");
      return;
    }
    if (nextStatus === "approved") {
      if (!title.trim() || !summary.trim() || questions.length === 0) {
        toast.error("ត្រូវការចំណងជើង សង្ខេប និងសំណួរ សិនទើបអនុម័តបាន។");
        return;
      }
    }
    setSaving(true);
    try {
      const input = { ...fields(), status: nextStatus };
      if (chapterId) await updateChapter(chapterId, input);
      else await createDraft(input);
      setStatus(nextStatus);
      toast.success(
        nextStatus === "approved" ? "បានអនុម័ត និងផ្សព្វផ្សាយ" : "បានរក្សាទុកជាព្រាង",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "មិនអាចរក្សាទុកបានទេ។");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-base focus:border-primary focus:outline-none";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* 1. Metadata */}
      <section className="ui-card p-5">
        <h2 className="font-bold text-primary">១. ព័ត៌មានមេរៀន</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            ថ្នាក់
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value) as Grade)}
              className={inputClass}
            >
              <option value={10}>ថ្នាក់ទី១០</option>
              <option value={11}>ថ្នាក់ទី១១</option>
              <option value={12}>ថ្នាក់ទី១២</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            មុខវិជ្ជា
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as SubjectId)}
              className={inputClass}
            >
              <option value="math">គណិតវិទ្យា</option>
              <option value="history">ប្រវត្តិវិទ្យា</option>
            </select>
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            ចំណងជើងមេរៀន
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ឧ. អនុគមន៍"
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">
            លំដាប់មេរៀន
            <input
              type="number"
              min={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      {/* 2. MoEYS video */}
      <section className="ui-card p-5">
        <h2 className="font-bold text-primary">២. វីដេអូ MoEYS</h2>
        <div className="mt-4 flex flex-col gap-4">
          <label className="text-sm font-medium">
            Embed URL
            <input
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">
            អត្ថបទបញ្ជាក់ប្រភព (Credit)
            <textarea
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      {/* 3. Source text + Generate */}
      <section className="ui-card p-5">
        <h2 className="font-bold text-primary">៣. អត្ថបទប្រភព (ពីសៀវភៅសិក្សា)</h2>
        <p className="mt-1 text-sm text-ink-muted">
          បិទភ្ជាប់អត្ថបទមេរៀនពី PDF សៀវភៅសិក្សា រួចចុច «បង្កើតដោយ AI» —
          AI នឹងសរសេរសង្ខេប និងសំណួរ MCQ ឱ្យស្វ័យប្រវត្តិ។
        </p>
        <textarea
          id="source-text"
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          rows={7}
          placeholder="បិទភ្ជាប់អត្ថបទមេរៀននៅទីនេះ…"
          className={inputClass}
        />
        <button
          type="button"
          onClick={generate}
          className={`ui-btn mt-4 min-h-11 w-full rounded-xl bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary-dark sm:w-auto ${
            !sourceText.trim() || generating ? "opacity-80" : ""
          }`}
        >
          {generating ? (
            <span className="inline-flex items-center gap-2">
              <span className="typing-dots typing-dots-light" aria-hidden>
                <span />
                <span />
                <span />
              </span>
              កំពុងបង្កើត…
            </span>
          ) : (
            "បង្កើតដោយ AI"
          )}
        </button>
        {generating ? (
          <p className="mt-2 text-sm text-ink-muted">
            AI កំពុងអានអត្ថបទប្រភព និងសរសេរសង្ខេប + សំណួរ…
          </p>
        ) : !sourceText.trim() ? (
          <p className="mt-2 text-sm text-ink-muted">
            បិទភ្ជាប់អត្ថបទប្រភពជាមុន ទើបចុចបង្កើតបាន។
          </p>
        ) : null}
      </section>

      {/* 4. Review generated content */}
      <section className="ui-card p-5">
        <h2 className="font-bold text-primary">៤. សង្ខេបមេរៀន (ពិនិត្យ និងកែសម្រួល)</h2>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={7}
          placeholder="សង្ខេបនឹងបង្ហាញនៅទីនេះបន្ទាប់ពីបង្កើតដោយ AI…"
          className={inputClass}
        />
      </section>

      <section className="ui-card p-5">
        <h2 className="font-bold text-primary">
          ៥. សំណួរ MCQ ({questions.length})
        </h2>
        {questions.length === 0 ? (
          <p className="mt-3 rounded-lg bg-bg px-4 py-6 text-center text-sm text-ink-muted">
            មិនទាន់មានសំណួរ — ប្រើ «បង្កើតដោយ AI» ខាងលើ
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-5">
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="rounded-lg border border-line p-4">
                <label className="text-sm font-medium">
                  សំណួរទី{toKhmerNumber(qIndex + 1)}
                  <input
                    value={question.prompt}
                    onChange={(e) => updateQuestion(qIndex, { prompt: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <div className="mt-3 flex flex-col gap-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={question.correctIndex === optionIndex}
                        onChange={() =>
                          updateQuestion(qIndex, { correctIndex: optionIndex })
                        }
                        title="ចម្លើយត្រឹមត្រូវ"
                        className="h-5 w-5 shrink-0 accent-primary"
                      />
                      <input
                        value={option}
                        onChange={(e) => {
                          const options = [...question.options];
                          options[optionIndex] = e.target.value;
                          updateQuestion(qIndex, { options });
                        }}
                        className="w-full rounded-md border border-line px-3 py-2 text-base focus:border-primary focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <label className="mt-3 block text-sm font-medium">
                  ការពន្យល់
                  <textarea
                    value={question.explanation}
                    onChange={(e) =>
                      updateQuestion(qIndex, { explanation: e.target.value })
                    }
                    rows={2}
                    className={inputClass}
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Publish */}
      <section className="ui-card flex flex-wrap items-center gap-3 p-5">
        <span className="text-sm font-medium">
          ស្ថានភាព៖{" "}
          {status === "approved" ? (
            <span className="font-bold text-success">បានអនុម័ត</span>
          ) : (
            <span className="font-bold text-cta">ព្រាង</span>
          )}
        </span>
        <div className="ml-auto flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => save("draft")}
            className={`ui-btn min-h-11 rounded-xl border border-primary px-5 py-2.5 font-semibold text-primary hover:bg-primary-light ${
              saving ? "opacity-60" : ""
            }`}
          >
            រក្សាទុកជាព្រាង
          </button>
          <button
            type="button"
            onClick={() => save("approved")}
            className={`ui-btn min-h-11 rounded-xl bg-cta px-5 py-2.5 font-semibold text-white hover:bg-cta-dark ${
              saving || !title.trim() || !summary.trim() || questions.length === 0 ? "opacity-80" : ""
            }`}
          >
            អនុម័ត និងផ្សព្វផ្សាយ
          </button>
        </div>
      </section>
    </div>
  );
}
