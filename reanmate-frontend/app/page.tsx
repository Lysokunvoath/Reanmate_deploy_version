import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SiteNavbar from "@/components/SiteNavbar";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-bg">
      <SiteNavbar variant="landing" homeHref="/" />

      <section className="relative isolate overflow-hidden lg:min-h-[calc(100vh-4.1rem)]">
        <Image
          src="/hero-school.jpg"
          alt="អគារសាលា"
          fill
          priority
          sizes="100vw"
          className="hero-ken object-cover object-[center_32%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-primary-dark/88 lg:bg-gradient-to-r lg:from-primary-dark lg:via-primary-dark/88 lg:to-primary-dark/35"
        />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col justify-center px-4 py-12 sm:px-6 lg:min-h-[calc(100vh-4.1rem)] lg:py-20">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="rise-left text-center text-white lg:text-left">
              <p className="ui-kicker mb-4 text-gold">ReanMate · មិត្ត AI</p>
              <h1 className="text-[1.75rem] font-bold leading-[1.45] sm:text-[2.45rem] lg:text-[2.8rem]">
                រៀនគណិត និងប្រវត្តិ
                <span className="gold-mark mt-1 block text-gold">តាមសៀវភៅក្រសួង</span>
              </h1>
              <p className="rise d2 mx-auto mt-5 max-w-md text-[1.05rem] leading-relaxed text-white/78 lg:mx-0">
                មើលវីដេអូ MoEYS សួរ AI ពេលមិនយល់ រួចធ្វើតេស្ត —
                សម្រាប់សិស្សថ្នាក់ទី១០ ដល់ទី១២។
              </p>

              <div className="rise d3 mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link
                  href="/login#signup"
                  className="ui-btn inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-cta px-8 py-3 text-base font-semibold text-white shadow-[0_12px_28px_rgba(224,86,86,0.35)] hover:bg-cta-dark sm:w-auto"
                >
                  ចុះឈ្មោះ
                </Link>
                <Link
                  href="/login"
                  className="ui-btn inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-6 py-3 text-base text-white/90 hover:bg-white/10"
                >
                  ចូលគណនី
                </Link>
              </div>
              <div className="rise d4 mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/55 lg:justify-start">
                <span>ភាសាខ្មែរ</span>
                <span className="h-1 w-1 rounded-full bg-gold/70" />
                <span>វីដេអូ MoEYS</span>
                <span className="h-1 w-1 rounded-full bg-gold/70" />
                <span>តេស្ត + ការពន្យល់</span>
              </div>
            </div>

            <div className="rise-right mx-auto w-full max-w-[20rem] sm:max-w-md lg:ml-auto lg:max-w-[580px]">
              <div className="landing-float-wrap">
                <div className="landing-hero-stage">
                  <div className="landing-mascot">
                    <Image
                      src="/mascot.png"
                      alt=""
                      width={400}
                      height={400}
                      priority
                      className="h-auto w-full select-none mascot-on-dark"
                    />
                  </div>

                  <div className="landing-card-col">
                    <Link
                      href="/login#signup"
                      className="landing-float block overflow-hidden rounded-2xl bg-white"
                    >
                      <div className="flex items-center justify-between bg-primary px-4 py-3">
                        <p className="text-sm font-medium text-white/90">
                          មេរៀនទី១ · អនុគមន៍
                        </p>
                        <span className="text-[11px] text-gold">ថ្នាក់ទី១០</span>
                      </div>
                      <div className="p-4">
                        <div className="flex aspect-[16/9] flex-col items-center justify-center rounded-xl bg-primary-dark">
                          <span className="play-pulse flex h-11 w-11 items-center justify-center rounded-full border border-gold/60 text-gold">
                            ▶
                          </span>
                          <p className="mt-2 text-[11px] text-white/55">វីដេអូ MoEYS</p>
                        </div>
                        <p className="mt-2 text-[11px] text-ink-muted">
                          ប្រភព៖ ក្រសួងអប់រំ យុវជន និងកីឡា
                        </p>
                        <div className="mt-4 space-y-2">
                          <div className="demo-msg-1 ml-6 rounded-2xl rounded-tr-md bg-primary px-3.5 py-2.5 text-[13px] leading-snug text-white">
                            តើដែនកំណត់នៃ f(x) = 1/x គឺជាអ្វី?
                          </div>
                          <div className="demo-msg-2 mr-4 rounded-2xl rounded-tl-md bg-primary-light px-3.5 py-2.5 text-[13px] leading-snug text-ink">
                            ដែនកំណត់គឺ ℝ\{"{0}"} ព្រោះមិនអាចចែកនឹងសូន្យបាន។
                          </div>
                        </div>
                        <div className="mt-4 rounded-md bg-cta py-2.5 text-center text-sm font-semibold text-white">
                          ចាប់ផ្តើមតេស្ត
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-3.5 text-sm text-ink-muted sm:px-6">
          <span>ថ្នាក់ទី១០–១២</span>
          <span className="h-1 w-1 rounded-full bg-gold/80" />
          <span>គណិតវិទ្យា</span>
          <span className="h-1 w-1 rounded-full bg-gold/80" />
          <span>ប្រវត្តិវិទ្យា</span>
        </div>
      </div>

      <section className="bg-surface">
        <Reveal className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="ui-kicker text-center">វិធីសិក្សា</p>
          <h2 className="mt-2 text-center text-2xl font-bold text-primary sm:text-3xl">
            បីជំហាន ក្នុងមួយមេរៀន
          </h2>

          <div className="stagger mt-12 grid gap-4 sm:grid-cols-3 sm:gap-6">
            {[
              {
                step: "០១",
                title: "មើលវីដេអូ MoEYS",
                body: "វីដេអូមេរៀនផ្លូវការពីក្រសួងអប់រំ តាមជំពូកសៀវភៅសិក្សា",
              },
              {
                step: "០២",
                title: "សួរ AI",
                body: "មានចំណុចមិនយល់ សួរបានភ្លាមៗ ជាភាសាខ្មែរ។ មានសំឡេងអានចម្លើយផង។",
              },
              {
                step: "០៣",
                title: "ធ្វើតេស្ត",
                body: "សំណួរ MCQ មានការពន្យល់ថាហេតុអ្វីចម្លើយត្រឹមត្រូវ",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="ui-card group relative overflow-hidden p-6 text-center sm:text-left"
              >
                <span className="absolute inset-x-8 top-0 h-px bg-gold/80" />
                <p className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary-dark text-sm font-semibold text-gold sm:mx-0">
                  {item.step}
                </p>
                <h3 className="mt-4 text-lg font-bold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="relative overflow-hidden border-t border-white/10 bg-primary px-4 py-14 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,176,92,0.16),_transparent_55%)]"
        />
        <Reveal className="relative">
          <p className="ui-kicker">ចាប់ផ្តើមឥឡូវនេះ</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            សាកល្បងមេរៀនថ្នាក់ទី១០
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/65">
            ចុះឈ្មោះ ឬចូលគណនី — ក៏អាចសាកល្បងភ្លាមៗដោយមិនចាំបាច់មានគណនី។
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login#signup"
              className="ui-btn inline-flex min-h-12 items-center rounded-xl bg-cta px-8 py-3 font-semibold text-white hover:bg-cta-dark"
            >
              ចុះឈ្មោះ
            </Link>
            <Link
              href="/login"
              className="ui-btn inline-flex min-h-12 items-center rounded-xl border border-white/25 px-6 py-3 font-semibold text-white/90 hover:bg-white/10"
            >
              ចូលគណនី
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="bg-primary-dark px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-center text-sm text-white/60">
        <p>
          ReanMate អាចមានកំហុស។ សូមពិនិត្យជាមួយវីដេអូ MoEYS
          និងសៀវភៅសិក្សា។
        </p>
        <p className="mt-3 text-xs text-white/35">© {new Date().getFullYear()} ReanMate</p>
      </footer>
    </div>
  );
}
