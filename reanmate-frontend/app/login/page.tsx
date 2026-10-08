"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Mascot from "@/components/Mascot";
import SiteNavbar from "@/components/SiteNavbar";
import { useToast } from "@/components/ToastProvider";
import { signIn, signUp } from "@/lib/api";

type AuthTab = "login" | "signup";

export default function LoginPage() {
  const [tab, setTab] = useState<AuthTab>("login");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (window.location.hash === "#signup") setTab("signup");
  }, []);

  const inputClass =
    "mt-1 w-full rounded-xl border border-line bg-bg/50 px-3 py-2.5 text-base focus:border-primary focus:outline-none";

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteNavbar variant="auth" homeHref="/" />

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="relative hidden overflow-hidden bg-primary-dark px-12 py-16 text-white lg:flex lg:w-[44%] lg:flex-col lg:justify-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(212,176,92,0.18),_transparent_55%)]"
          />
          <div className="relative">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary">
              <Mascot size={80} onDark className="mascot-bob" />
            </div>
            <p className="ui-kicker">ReanMate · មិត្ត AI</p>
            <h2 className="mt-3 text-3xl font-bold leading-snug">
              រៀនគណិត និងប្រវត្តិ
              <span className="mt-1 block text-gold">ជាមួយមិត្ត AI</span>
            </h2>
            <ul className="mt-8 space-y-3 text-sm text-white/70">
              <li>មើលវីដេអូ MoEYS តាមមេរៀន</li>
              <li>សួរ AI បើមានចំណុចមិនយល់</li>
              <li>ធ្វើតេស្ត មានការពន្យល់</li>
            </ul>
          </div>
        </aside>

        <main className="rise mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-4 py-14 pb-[max(2.5rem,env(safe-area-inset-bottom))] lg:max-w-none lg:px-10">
          <div className="mx-auto w-full max-w-[420px] ui-card px-6 py-8 sm:px-8">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-dark lg:hidden">
              <Mascot size={64} onDark className="mascot-bob" />
            </div>
            <h1 className="text-center text-2xl font-bold text-primary">
              {tab === "login" ? "ចូលគណនី" : "ចុះឈ្មោះ"}
            </h1>
            <p className="mt-1 text-center text-sm text-ink-muted">
              សាកល្បងឥឡូវនេះ — មិនចាំបាច់បង្កើតគណនី
            </p>

            <div className="mt-7 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setTab("login")}
                className="ui-btn min-h-11 rounded-xl bg-cta py-2.5 text-center font-semibold text-white hover:bg-cta-dark"
              >
                ចូលជាសិស្ស
              </button>
              <button
                type="button"
                onClick={() => setTab("login")}
                className="ui-btn min-h-11 rounded-xl border border-primary/20 py-2.5 text-center font-semibold text-primary hover:bg-primary-light"
              >
                ចូលជា Admin
              </button>
            </div>

            <div className="my-6 flex items-center gap-3 text-xs text-ink-muted">
              <span className="h-px flex-1 bg-line" />
              ឬប្រើគណនី
              <span className="h-px flex-1 bg-line" />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-bg p-1">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`ui-btn min-h-11 rounded-lg text-sm font-semibold ${
                  tab === "login"
                    ? "bg-surface text-primary shadow-sm"
                    : "text-ink-muted hover:text-primary"
                }`}
              >
                ចូល
              </button>
              <button
                type="button"
                onClick={() => setTab("signup")}
                className={`ui-btn min-h-11 rounded-lg text-sm font-semibold ${
                  tab === "signup"
                    ? "bg-surface text-primary shadow-sm"
                    : "text-ink-muted hover:text-primary"
                }`}
              >
                ចុះឈ្មោះ
              </button>
            </div>

            {tab === "login" ? (
              <form
                className="flex flex-col gap-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  setSubmitting(true);
                  try {
                    const result = await signIn(
                      String(data.get("email") ?? ""),
                      String(data.get("password") ?? ""),
                    );
                    router.replace(result.user.role === "admin" ? "/admin" : "/home");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "ចូលគណនីមិនបានទេ។");
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <label className="text-sm font-medium">
                  អ៊ីមែល
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-medium">
                  ពាក្យសម្ងាត់
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="ui-btn min-h-11 rounded-xl bg-primary py-2.5 font-semibold text-white hover:bg-primary-dark"
                >
                  {submitting ? "កំពុងចូល..." : "ចូល"}
                </button>
              </form>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  const name = String(data.get("displayName") ?? "").trim();
                  const email = String(data.get("email") ?? "");
                  const password = String(data.get("password") ?? "");
                  const confirm = String(data.get("confirm") ?? "");
                  if (password !== confirm) {
                    toast.error("ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នាទេ។");
                    return;
                  }
                  setSubmitting(true);
                  try {
                    await signUp(name, email, password);
                    router.replace("/home");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "បង្កើតគណនីមិនបានទេ។");
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <label className="text-sm font-medium">
                  ឈ្មោះ
                  <input
                    type="text"
                    name="displayName"
                    autoComplete="name"
                    placeholder="ឈ្មោះសិស្ស"
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-medium">
                  អ៊ីមែល
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-medium">
                  ពាក្យសម្ងាត់
                  <input
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-medium">
                  បញ្ជាក់ពាក្យសម្ងាត់
                  <input
                    type="password"
                    name="confirm"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="ui-btn min-h-11 rounded-xl bg-primary py-2.5 font-semibold text-white hover:bg-primary-dark"
                >
                  {submitting ? "កំពុងបង្កើត..." : "បង្កើតគណនី"}
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
