import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Compass, Sparkles, Plus } from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import UserJornadasSection from "@/components/Jornadas/UserJornadasSection";
import { verifySessionCookie } from "@/lib/session";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Jornadas de Edital · AIVUR",
  description: "Planeje e acompanhe sua evolução no edital do seu concurso tópico por tópico.",
};

export default async function JornadasPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aivur_session");
  const session = await verifySessionCookie(sessionCookie?.value);

  if (!session.valid) {
    redirect("/login?redirect=/jornadas");
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-muted)] text-sm">
          Carregando jornadas...
        </div>
      }
    >
      <div className="flex flex-col min-h-screen w-full bg-[var(--color-bg)]">
        <Header />
        <main className="flex-1 block w-full py-8 md:py-12">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col gap-8 md:gap-10">
            {/* ── HERO — CENTRAL DE JORNADAS DE EDITAL ── */}
            <section
              aria-labelledby="jornadas-hero-title"
              className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 sm:px-8 md:px-10 md:py-10 shadow-xs"
            >
              <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-between">
                <div className="flex flex-col items-start text-left min-w-0 flex-1">
                  <span className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest">
                    <Compass size={14} className="shrink-0 flex-none" strokeWidth={2.4} aria-hidden="true" />
                    Central de Editais
                  </span>
                  <h1
                    id="jornadas-hero-title"
                    className="m-0 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--color-heading)] tracking-tight leading-tight"
                  >
                    Jornadas <span className="text-[var(--color-primary)]">de Edital</span>
                  </h1>
                  <p className="m-0 mt-3 text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed max-w-xl">
                    Verticalize o edital do seu concurso público. Acompanhe a cobertura tópico a tópico e estude com direcionamento estratégico até o dia da prova.
                  </p>
                  <div className="mt-6 flex w-full flex-col sm:flex-row sm:w-auto gap-3">
                    <Link
                      href="/jornadas/novo"
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white text-sm md:text-base font-bold no-underline transition-opacity shadow-xs"
                    >
                      <Plus size={18} strokeWidth={2} className="shrink-0 flex-none" aria-hidden="true" />
                      Importar Novo Edital
                    </Link>
                    <Link
                      href="/trilhas"
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-heading)] text-sm md:text-base font-semibold no-underline transition-colors hover:bg-[var(--color-surface-offset)]"
                    >
                      <Sparkles size={18} strokeWidth={1.5} className="shrink-0 flex-none text-[var(--color-primary)]" />
                      Acessar Trilhas
                    </Link>
                  </div>
                </div>

                <div className="hidden sm:flex items-center justify-center shrink-0">
                  <div className="w-[140px] h-[140px] md:w-[180px] md:h-[180px] rounded-3xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/15 flex items-center justify-center text-[var(--color-primary)] shadow-inner">
                    <Compass size={72} strokeWidth={1.3} className="shrink-0 flex-none animate-pulse motion-reduce:animate-none" />
                  </div>
                </div>
              </div>
            </section>

            {/* ── LISTAGEM DE JORNADAS DO USUÁRIO ── */}
            <UserJornadasSection />
          </div>
        </main>
        <Footer />
      </div>
    </Suspense>
  );
}
