"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const chapterBar =
    /^\/learn\/\d+\/(math|history)\/[^/]+$/.test(pathname ?? "") &&
    !pathname.endsWith("/quiz");

  return (
    <footer
      className={`mt-auto border-t border-line bg-surface/80 ${
        chapterBar ? "mb-[4.75rem] lg:mb-0" : ""
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-ink-muted">
        <p>
          ReanMate អាចមានកំហុស។ សូមពិនិត្យជាមួយវីដេអូ MoEYS
          និងសៀវភៅសិក្សា។
        </p>
        <p className="mt-3 pb-[env(safe-area-inset-bottom)] text-xs tracking-wide text-ink-muted/80">
          © {new Date().getFullYear()} ReanMate
        </p>
      </div>
    </footer>
  );
}
