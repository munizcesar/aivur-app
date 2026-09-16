import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
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
                <span className={styles.eyebrow}>✦ Plano de estudos</span>
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))", gap: "14px" }}>
            {TRILHAS_MOCK.map((trilha) => (
              <div
                key={trilha.id}
                style={{
                  borderRadius: "16px", border: "1px solid var(--color-border)",
                  background: "var(--color-surface)", padding: "20px",
                  display: "flex", flexDirection: "column", gap: "12px",
                }}
              >
                <div>
                  <span style={{
                    display: "inline-block", padding: "3px 10px", borderRadius: "999px",
                    background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
                    color: "var(--color-primary)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em",
                    marginBottom: "8px",
                  }}>
                    {trilha.disciplina}
                  </span>
                  <h3 style={{ margin: 0, color: "var(--color-heading)", fontSize: "15px", fontWeight: 700, lineHeight: 1.3 }}>
                    {trilha.titulo}
                  </h3>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 600 }}>Progresso</span>
                    <span style={{ fontSize: "11px", color: trilha.progresso > 0 ? "var(--color-primary)" : "var(--color-text-muted)", fontWeight: 700 }}>
                      {trilha.progresso}%
                    </span>
                  </div>
                  <div style={{ height: "5px", borderRadius: "999px", background: "var(--color-surface-offset)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${trilha.progresso}%`, borderRadius: "999px",
                      background: "var(--color-primary)",
                    }} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", fontSize: "11px", color: "var(--color-text-muted)" }}>
                  <span>🃏 {trilha.flashcards.length} cards</span>
                  <span>·</span>
                  <span>📝 {trilha.questoes.length} questões</span>
                </div>

                <Link
                  href={`/trilhas/${trilha.id}`}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    padding: "9px 16px", borderRadius: "10px", marginTop: "auto",
                    background: "var(--color-primary)", border: "1px solid var(--color-primary)",
                    color: "white", fontSize: "13px", fontWeight: 700, textDecoration: "none",
                  }}
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
