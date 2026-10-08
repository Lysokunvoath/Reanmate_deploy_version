"use client";

import { useRouter } from "next/navigation";
import Mascot from "@/components/Mascot";

export default function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  const router = useRouter();

  return (
    <div className="ui-card flex flex-col items-center px-6 py-14 text-center">
      <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-primary-dark">
        <Mascot size={56} onDark className="mascot-bob" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">{body}</p>
      {actionHref && actionLabel ? (
        <button
          type="button"
          onClick={() => router.replace(actionHref)}
          className="ui-btn mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
