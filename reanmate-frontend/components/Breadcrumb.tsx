import Link from "next/link";

export default function Breadcrumb({
  items,
}: {
  items: Array<{ href?: string; label: string }>;
}) {
  return (
    <nav
      aria-label="ទីតាំង"
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ink-muted"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span
            key={`${item.label}-${index}`}
            className="inline-flex min-w-0 max-w-full items-center gap-x-1.5"
          >
            {index > 0 ? (
              <span aria-hidden className="text-ink-muted/50">
                /
              </span>
            ) : null}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="inline-flex min-h-9 items-center transition hover:text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "truncate text-ink" : undefined}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
