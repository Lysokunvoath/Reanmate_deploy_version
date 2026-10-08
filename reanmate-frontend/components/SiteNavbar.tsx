import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

type SiteNavbarProps = {
  homeHref?: string;
  variant?: "landing" | "app" | "auth";
  gradeLabel?: string;
  isAdmin?: boolean;
  homeActive?: boolean;
};

export default function SiteNavbar({
  homeHref = "/",
  variant = "landing",
  gradeLabel,
  isAdmin = false,
  homeActive = false,
}: SiteNavbarProps) {
  return (
    <header className="nav-in sticky top-0 z-30 border-b border-white/10 bg-primary-dark/95 text-white backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href={homeHref} className="inline-flex min-h-11 min-w-11 items-center shrink">
          <BrandLogo size={34} onDark />
        </Link>

        {variant === "landing" ? (
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="hidden min-h-10 items-center px-3 py-1.5 text-sm text-white/70 transition hover:text-white sm:inline-flex"
            >
              ចូលគណនី
            </Link>
            <Link
              href="/login#signup"
              className="ui-btn inline-flex min-h-10 items-center rounded-xl bg-cta px-4 py-2 text-sm font-semibold text-white hover:bg-cta-dark"
            >
              ចុះឈ្មោះ
            </Link>
          </nav>
        ) : null}

        {variant === "app" ? (
          <nav className="flex shrink-0 items-center gap-1 sm:gap-3">
            {isAdmin ? (
              <>
                <span className="hidden text-xs font-semibold tracking-wide text-gold sm:inline">
                  Admin
                </span>
                <Link
                  href="/home"
                  className="inline-flex min-h-11 items-center px-2 py-1.5 text-sm text-white/70 transition hover:text-white sm:px-3"
                >
                  មើលជាសិស្ស
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/home"
                  className={`inline-flex min-h-11 items-center px-2 py-1.5 text-sm transition sm:px-3 ${
                    homeActive ? "font-semibold text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  ទំព័រដើម
                </Link>
                {gradeLabel ? (
                  <span className="hidden text-xs text-gold sm:inline">{gradeLabel}</span>
                ) : null}
              </>
            )}
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-3 py-1.5 text-sm text-white/85 transition hover:border-white/40 hover:bg-white/5"
            >
              ចេញ
            </Link>
          </nav>
        ) : null}

        {variant === "auth" ? (
          <Link
            href="/"
            replace
            className="inline-flex min-h-11 items-center gap-1.5 px-2.5 py-1.5 text-sm text-white/70 transition hover:text-white"
          >
            ← ត្រឡប់
          </Link>
        ) : null}
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
    </header>
  );
}
