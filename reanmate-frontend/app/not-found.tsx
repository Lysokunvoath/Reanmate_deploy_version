import Link from "next/link";
import Mascot from "@/components/Mascot";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary-dark">
        <Mascot size={64} onDark className="mascot-bob" />
      </div>
      <p className="text-sm font-medium text-gold">៤០៤</p>
      <h1 className="mt-2 text-2xl font-bold text-primary">រកមិនឃើញទំព័រនេះ</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        ទំព័រនេះមិនមាន ឬមេរៀននេះមិនទាន់បានអនុម័ត។
      </p>
      <Link
        href="/home"
        className="ui-btn mt-6 inline-flex min-h-11 items-center rounded-xl bg-cta px-5 py-2.5 font-semibold text-white hover:bg-cta-dark"
      >
        ត្រឡប់ទៅទំព័រដើម
      </Link>
    </div>
  );
}
