import type { Metadata } from "next";
import { BookOpen, ListChecks, Sparkles } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import { TRILHAS_MOCK } from "@/mocks/trilhasMock";
import UserTrilhasGrid from '@/components/Trilhas/UserTrilhasGrid';
import TrilhasErrorBoundary from '@/components/Trilhas/TrilhasErrorBoundary';

export const metadata: Metadata = {
  title: "Trilhas de Estudo · AIVUR",
  description: "Evolua pelo edital com trilhas personalizadas.",
};

export default function TrilhasPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg)]">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8">
          
          {/* ── HERO BANNER ── */}
          <section aria-labelledby="trilhas-title" className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mb-12 md:mb-16">
            <div className="flex flex-col items-start text-left">
              <span className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 border border-[var(--color-primary)]/30 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest">
                <Sparkles size={14} className="shrink-0" strokeWidth={2.4} aria-hidden="true" />
                Plano de estudos
              </span>
              <h1 id="trilhas-title" className="m-0 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--color-heading)] tracking-tight leading-tight">
                Suas Trilhas <span className="text-[var(--color-primary)] whitespace-nowrap">de Estudo</span>
              </h1>
              <p className="mt-4 md:mt-6 text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed max-w-xl">
                Evolua pelo edital com disciplina. Marque tópicos concluídos e acompanhe sua taxa de retenção em tempo real.
              </p>
              <div className="mt-6 md:mt-8 w-full sm:w-auto">
                <Link href="/trilhas/novo" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm md:text-base font-bold shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all active:scale-95 border border-[var(--color-primary)]/20">
                  <Sparkles size={18} aria-hidden="true" />
                  Gerar trilha com IA
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center min-h-[200px] md:min-h-[250px] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/aivur/trilhas.png" alt="Aivo indicando o caminho de estudos" className="w-full max-w-[260px] md:max-w-[330px] h-auto object-contain animate-float-premium" />
            </div>
          </section>

          {/* ── GRID DO USUÁRIO ── */}
          <section className="mb-16">
            <TrilhasErrorBoundary>
              <UserTrilhasGrid />
            </TrilhasErrorBoundary>
          </section>

          {/* ── EXEMPLOS MOCK (Microlearning) ── */}
          <section aria-labelledby="micro-title">
            <hr className="mb-10 border-t border-[rgba(107,153,179,0.2)]" />
            
            <div className="mb-8 flex flex-col items-start gap-1">
              <h2 id="micro-title" className="text-xl md:text-2xl font-extrabold text-[var(--color-heading)] m-0 tracking-tight">Exemplos de Trilhas</h2>
              <p className="text-sm text-[var(--color-text-muted)] m-0">Explore exemplos de trilhas de microlearning. (Estes são dados de demonstração)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TRILHAS_MOCK.map((trilha) => (
                <div
                  key={trilha.id}
                  className="flex flex-col gap-3 p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:-translate-y-1 hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <span className="inline-block px-2.5 py-1 mb-2 rounded-full bg-[var(--color-navy)] border border-[var(--color-cream)]/20 text-[var(--color-cream)] text-[11px] font-extrabold tracking-wider">
                      {trilha.disciplina}
                    </span>
                    <h3 className="m-0 text-[15px] font-bold leading-snug text-[var(--color-heading)] break-words">
                      {trilha.titulo}
                    </h3>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">Progresso</span>
                      <span className={`text-[11px] font-bold ${trilha.progresso > 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                        {trilha.progresso > 0 ? `${trilha.progresso}%` : 'Não iniciado'}
                      </span>
                    </div>
                    <div className="h-[5px] overflow-hidden rounded-full bg-[var(--color-surface-offset)] border border-[rgba(107,153,179,0.15)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                        style={{ width: `${trilha.progresso > 0 ? trilha.progresso : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 text-[11px] text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen size={14} strokeWidth={2.2} aria-hidden="true" />
                      {trilha.flashcards.length} cards
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <ListChecks size={14} strokeWidth={2.2} aria-hidden="true" />
                      {trilha.questoes.length} questões
                    </span>
                  </div>

                  <Link
                    href={`/trilhas/${trilha.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 mt-auto text-[13px] font-bold text-white no-underline transition-opacity rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] hover:opacity-90"
                  >
                    Abrir Aula →
                  </Link>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
      <Footer />
      <SideDrawer />
    </div>
  );
}
