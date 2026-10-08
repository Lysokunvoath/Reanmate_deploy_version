import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}
