"use client";

import { useRouter } from "next/navigation";

/** Lets overlay screens skip a second confirm when ← ត្រឡប់ already handled leave. */
export const overlayNav = { skipPop: false };

export default function BackLink({
  href,
  label = "ត្រឡប់",
  confirmMessage,
}: {
  href: string;
  label?: string;
  confirmMessage?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        const state = window.history.state as
          | { reanmateChat?: number; reanmateQuiz?: number }
          | null;
        if (state?.reanmateChat || state?.reanmateQuiz) {
          overlayNav.skipPop = true;
          window.history.go(-2);
          return;
        }
        router.replace(href);
      }}
      className="inline-flex min-h-11 max-w-full cursor-pointer items-center gap-2 -ml-1 px-1 text-left text-sm font-medium text-ink-muted transition hover:text-primary"
      aria-label={label}
    >
      <span aria-hidden className="text-base leading-none">
        ←
      </span>
      {label}
    </button>
  );
}
