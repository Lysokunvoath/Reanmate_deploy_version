"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ChatPanel from "@/components/ChatPanel";
import ListenButton from "@/components/ListenButton";
import Mascot from "@/components/Mascot";
import StudySteps from "@/components/StudySteps";
import VideoEmbed from "@/components/VideoEmbed";
import { setLastVisited } from "@/lib/progress";
import type { Chapter } from "@/lib/types";

export default function ChapterStudy({ chapter }: { chapter: Chapter }) {
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    setLastVisited({
      chapterId: chapter.id,
      grade: chapter.grade,
      subject: chapter.subject,
      title: chapter.title,
    });
  }, [chapter]);

  useEffect(() => {
    if (!chatOpen) return;
    const onPop = () => setChatOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const shouldPop = Boolean(
        (window.history.state as { reanmateChat?: number } | null)?.reanmateChat,
      );
      setChatOpen(false);
      if (shouldPop) window.history.back();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, [chatOpen]);

  useEffect(() => {
    if (!chatOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [chatOpen]);

  useEffect(() => {
    if (window.location.hash === "#ask-ai" && !window.matchMedia("(min-width: 1024px)").matches) {
      if (!(window.history.state as { reanmateChat?: number } | null)?.reanmateChat) {
        window.history.pushState({ ...window.history.state, reanmateChat: 1 }, "");
      }
      setChatOpen(true);
    }
  }, []);

  const quizHref = `/learn/${chapter.grade}/${chapter.subject}/${chapter.id}/quiz`;

  const openChat = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      document.getElementById("ask-ai")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!chatOpen) {
      if (!(window.history.state as { reanmateChat?: number } | null)?.reanmateChat) {
        window.history.pushState({ ...window.history.state, reanmateChat: 1 }, "");
      }
    }
    setChatOpen(true);
  };

  const closeChat = () => {
    const shouldPop = Boolean(
      (window.history.state as { reanmateChat?: number } | null)?.reanmateChat,
    );
    setChatOpen(false);
    if (shouldPop) window.history.back();
  };

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-6">
      <div className="flex flex-col gap-5 pb-28 lg:pb-0">
        <StudySteps current={1} quizHref={quizHref} onAsk={openChat} />

        <VideoEmbed
          embedUrl={chapter.moeysEmbedUrl}
          credit={chapter.moeysCredit}
          title={chapter.title}
        />

        <section className="ui-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
            <h2 className="text-sm font-semibold text-primary">សង្ខេបមេរៀន</h2>
            <ListenButton text={chapter.summary} />
          </div>
          <p className="whitespace-pre-line px-5 py-4 text-[15px] leading-relaxed">
            {chapter.summary}
          </p>
        </section>

        <div className="hidden ui-card p-5 text-center lg:block">
          <p className="text-xs font-semibold text-gold">ជំហានទី៣</p>
          <p className="mt-1 text-sm text-ink-muted">ឆ្លើយសំណួរ MCQ ដើម្បីបញ្ចប់មេរៀន</p>
          <Link
            href={quizHref}
            className="ui-btn mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-cta py-3.5 text-base font-semibold text-white hover:bg-cta-dark"
          >
            ចាប់ផ្តើមតេស្ត
          </Link>
        </div>
      </div>

      <aside id="ask-ai" className="sticky top-[calc(5rem+env(safe-area-inset-top))] hidden h-[calc(100vh-8.5rem-env(safe-area-inset-top))] lg:block">
        <ChatPanel chapterId={chapter.id} subject={chapter.subject} />
      </aside>

      {!chatOpen ? (
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-surface/95 p-3 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={openChat}
          className="ui-btn inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-dark px-3 text-sm font-semibold text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary">
            <Mascot size={26} onDark />
          </span>
          សួរ AI
        </button>
        <Link
          href={quizHref}
          className="ui-btn inline-flex min-h-12 flex-1 items-center justify-center whitespace-nowrap rounded-xl bg-cta px-3 text-sm font-semibold text-white hover:bg-cta-dark"
        >
          ធ្វើតេស្ត
        </Link>
      </div>
      ) : null}

      {chatOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="បិទ"
            onClick={closeChat}
            className="overlay-in absolute inset-0 bg-black/50"
          />
          <div className="sheet-up absolute inset-x-0 bottom-0 top-[calc(4rem+env(safe-area-inset-top))] flex flex-col rounded-t-2xl bg-surface shadow-[0_-16px_40px_rgba(0,0,0,0.18)]">
            <button
              type="button"
              onClick={closeChat}
              className="flex min-h-11 flex-col items-center justify-center pt-1 text-sm text-ink-muted"
            >
              <span className="mb-1 h-1 w-10 rounded-full bg-line" />
              បិទ
            </button>
            <div className="min-h-0 flex-1 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="h-full">
                <ChatPanel chapterId={chapter.id} subject={chapter.subject} autoFocus />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
