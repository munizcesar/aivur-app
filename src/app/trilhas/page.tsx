import type { Metadata } from "next";
import { BookOpen, ListChecks, Sparkles } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import { TRILHAS_MOCK } from "@/mocks/trilhasMock";
import UserTrilhasGrid from '@/components/Trilhas/UserTrilhasGrid';
import styles from './trilhas.module.css';

export const metadata: Metadata = {
  title: "Trilhas de Estudo · AIVUR",
  description: "Evolua pelo edital com trilhas personalizadas.",
};


export default function TrilhasPage() {
  
  return (
    <div className={styles.page}>
      <Header />
      <main>
        <section className={styles.hero} aria-labelledby="trilhas-title">
          <div className={styles.heroInner}>
            <div className={styles.heroGrid}>
              <div className={styles.copy}>
                <span className={styles.eyebrow}>
                  <Sparkles className={styles.eyebrowIcon} aria-hidden="true" />
                  Plano de estudos
                </span>
                <h1 id="trilhas-title" className={styles.title}>
                  Suas Trilhas <span className={styles.titleAccent}>de Estudo</span>
                </h1>
                <p className={styles.description}>
                  Evolua pelo edital com disciplina. Marque tópicos concluídos e acompanhe sua taxa de retenção em tempo real.
                </p>
                <div className={styles.heroActions}>
                  <Link className={styles.primaryAction} href="/trilhas/novo">
                    <Sparkles size={18} aria-hidden="true" />
                    Gerar trilha com IA
                  </Link>
                </div>
              </div>

              <div className={styles.heroArt}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/aivur/trilhas.png" alt="Aivo indicando o caminho de estudos" width={330} height={330} />
              </div>
            </div>
            
          </div>
        </section>

        <UserTrilhasGrid />

        {/* ── Microlearning Trilhas Grid ── */}
        <section
          aria-labelledby="micro-title"
          className={styles.content}
          style={{ paddingTop: 0 }}
        >
          <div className={styles.sectionHeader}>
            <div>
              <h2 id="micro-title" className={styles.sectionTitle}>Trilhas de Microlearning</h2>
              <p className={styles.sectionHint}>Aulas curtas com vídeo, flashcards 3D e questões de fixação.</p>
            </div>
            
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {TRILHAS_MOCK.map((trilha) => (
              <div
                key={trilha.id}
                className="flex flex-col gap-3 p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <div>
                  <span className="inline-block px-2.5 py-1 mb-2 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] text-[11px] font-extrabold tracking-wider">
                    {trilha.disciplina}
                  </span>
                  <h3 className="m-0 text-[15px] font-bold leading-snug text-[var(--color-heading)]">
                    {trilha.titulo}
                  </h3>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">Progresso</span>
                    <span className={`text-[11px] font-bold ${trilha.progresso > 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                      {trilha.progresso}%
                    </span>
                  </div>
                  <div className="h-[5px] overflow-hidden rounded-full bg-[var(--color-surface-offset)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                      style={{ width: `${trilha.progresso}%` }}
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
      </main>
      <Footer />
      <SideDrawer />
    </div>
  );
}
