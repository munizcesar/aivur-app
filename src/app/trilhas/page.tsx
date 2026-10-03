import type { Metadata } from "next";
import { ArrowRight, Layers, ListChecks, Sparkles } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import { TRILHAS_MOCK } from "@/mocks/trilhasMock";
import UserTrilhasGrid from '@/components/Trilhas/UserTrilhasGrid';
import TrilhasErrorBoundary from '@/components/Trilhas/TrilhasErrorBoundary';
import TrilhaProgressBar from '@/components/Trilhas/TrilhaProgressBar';

export const metadata: Metadata = {
  title: "Trilhas de Estudo · AIVUR",
  description: "Evolua pelo edital com trilhas personalizadas.",
};

export default function TrilhasPage() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-[var(--color-bg)]">
      <Header />
      <main className="flex-1 block w-full py-8 md:py-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col gap-12 md:gap-16">

          {/* ── HERO — CENTRAL DE TRILHAS ── */}
          <section
            aria-labelledby="trilhas-title"
            className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 sm:px-8 md:px-10 md:py-10 shadow-sm"
          >
            <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-between">
              <div className="flex flex-col items-start text-left min-w-0 flex-1">
                <span className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest">
                  <Sparkles size={14} className="shrink-0 flex-none" strokeWidth={2.4} aria-hidden="true" />
                  Central de trilhas
                </span>
                <h1 id="trilhas-title" className="m-0 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--color-heading)] tracking-tight leading-tight">
                  Suas Trilhas <span className="text-[var(--color-primary)]">de Estudo</span>
                </h1>
                <p className="m-0 mt-3 text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed max-w-xl">
                  Evolua pelo edital com disciplina. Marque tópicos concluídos e acompanhe sua taxa de retenção em tempo real.
                </p>
                <div className="mt-6 flex w-full flex-col sm:flex-row sm:w-auto gap-3">
                  <Link
                    href="/trilhas/novo"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm md:text-base font-bold no-underline shadow-sm transition-colors active:scale-[0.98]"
                  >
                    <Sparkles size={18} className="shrink-0 flex-none" aria-hidden="true" />
                    Gerar trilha com IA
                  </Link>
                  <a
                    href="#exemplos"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-[var(--color-border)] text-[var(--color-heading)] text-sm md:text-base font-semibold no-underline transition-colors hover:bg-[var(--color-surface-offset)]"
                  >
                    Ver exemplos
                  </a>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/aivur/trilhas.png"
                  alt="Aivo indicando o caminho de estudos"
                  width={1254}
                  height={1254}
                  className="w-[160px] md:w-[200px] lg:w-[230px] h-auto object-contain animate-float-premium motion-reduce:animate-none"
                />
              </div>
            </div>
          </section>

          {/* ── MINHAS TRILHAS (dados reais do usuário) ── */}
          <section aria-labelledby="minhas-trilhas-title">
            <TrilhasErrorBoundary>
              <UserTrilhasGrid />
            </TrilhasErrorBoundary>
          </section>

          {/* ── EXEMPLOS DE TRILHAS (dados de demonstração) ── */}
          <section
            id="exemplos"
            aria-labelledby="micro-title"
            className="scroll-mt-24 rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-offset)]/40 p-5 sm:p-6 md:p-8"
          >
            <div className="mb-6 flex flex-col items-start gap-2">
              <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Demonstração
              </span>
              <h2 id="micro-title" className="m-0 text-xl md:text-2xl font-extrabold text-[var(--color-heading)] tracking-tight">Exemplos de Trilhas</h2>
              <p className="m-0 text-sm text-[var(--color-text-muted)] max-w-xl">
                Explore exemplos de trilhas de microlearning. Estes são dados de demonstração e não afetam suas trilhas.
              </p>
            </div>

            <ul className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {TRILHAS_MOCK.map((trilha) => (
                <li
                  key={trilha.id}
                  className="group flex flex-col min-w-0 gap-4 p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="min-w-0">
                    <span className="block truncate text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      {trilha.disciplina}
                    </span>
                    <h3 className="m-0 mt-1.5 text-[15px] font-bold leading-snug text-[var(--color-heading)] line-clamp-2 break-words">
                      {trilha.titulo}
                    </h3>
                  </div>

                  <TrilhaProgressBar percent={trilha.progresso} label="Progresso" emptyLabel="Não iniciado" />

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <Layers size={14} strokeWidth={2.2} className="shrink-0 flex-none" aria-hidden="true" />
                      {trilha.flashcards.length} cards
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ListChecks size={14} strokeWidth={2.2} className="shrink-0 flex-none" aria-hidden="true" />
                      {trilha.questoes.length} questões
                    </span>
                  </div>

                  <Link
                    href={`/trilhas/${trilha.id}`}
                    className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-bold no-underline rounded-xl border border-[var(--color-border)] text-[var(--color-heading)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  >
                    Abrir aula
                    <ArrowRight size={14} strokeWidth={2.2} className="shrink-0 flex-none transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

        </div>
      </main>
      <Footer />
      <SideDrawer />
    </div>
  );
}
