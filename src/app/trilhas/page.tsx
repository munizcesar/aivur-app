import type { Metadata } from "next";
import { Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import TrilhasAccordion from "@/components/Cockpit/TrilhasAccordion";
import TrilhaSelector from "@/components/Cockpit/parts/TrilhaSelector";
import { TRILHAS_CATALOG } from "@/data/trilhas/schema";
import { TRILHAS_MOCK } from "@/mocks/trilhasMock";
import styles from "./trilhas.module.css";

export const metadata: Metadata = {
  title: "Trilhas de Estudo · AIVUR",
  description: "Evolua pelo edital com trilhas personalizadas.",
};

const TRILHA_ATIVA = TRILHAS_CATALOG[0];

export default function TrilhasPage() {
  const { disciplinas } = TRILHA_ATIVA;

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
            <div className={styles.selector}>
              <TrilhaSelector activeTrilhaId={TRILHA_ATIVA.id} />
            </div>
          </div>
        </section>

        <section className={styles.content} aria-labelledby="disciplinas-title">
          <div className={styles.sectionHeader}>
            <div>
              <h2 id="disciplinas-title" className={styles.sectionTitle}>Seu caminho, por etapas</h2>
              <p className={styles.sectionHint}>Escolha uma disciplina para visualizar os tópicos e começar.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8ca6b8]">
              <CheckCircle2 size={14} className="text-emerald-400" /> Progresso salvo automaticamente
            </span>
          </div>
          <div className={styles.accordionList}>
            {disciplinas.map((disc, idx) => (
              <TrilhasAccordion
                key={disc.id}
                moduleId={disc.id}
                title={disc.title}
                topics={disc.topics}
                disciplineIndex={idx}
              />
            ))}
          </div>
        </section>

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
            <Link
              href="/trilhas/criar"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px",
                minHeight: "40px", padding: "0 16px", borderRadius: "10px",
                background: "linear-gradient(135deg, #e03b5a, #b7193b)", color: "white",
                fontSize: "13px", fontWeight: 800, textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              + Nova Trilha
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))", gap: "14px" }}>
            {TRILHAS_MOCK.map((trilha) => (
              <div
                key={trilha.id}
                style={{
                  borderRadius: "16px", border: "1px solid rgba(140,166,184,0.15)",
                  background: "rgba(10,46,69,0.35)", padding: "20px",
                  display: "flex", flexDirection: "column", gap: "12px",
                }}
              >
                <div>
                  <span style={{
                    display: "inline-block", padding: "3px 10px", borderRadius: "999px",
                    background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
                    color: "#d8b75c", fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em",
                    marginBottom: "8px",
                  }}>
                    {trilha.disciplina}
                  </span>
                  <h3 style={{ margin: 0, color: "#f8ecd7", fontSize: "15px", fontWeight: 700, lineHeight: 1.3 }}>
                    {trilha.titulo}
                  </h3>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <span style={{ fontSize: "11px", color: "#8ca6b8", fontWeight: 600 }}>Progresso</span>
                    <span style={{ fontSize: "11px", color: trilha.progresso > 0 ? "#10b981" : "#8ca6b8", fontWeight: 700 }}>
                      {trilha.progresso}%
                    </span>
                  </div>
                  <div style={{ height: "5px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${trilha.progresso}%`, borderRadius: "999px",
                      background: "linear-gradient(90deg, #10b981, #34d399)",
                    }} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", fontSize: "11px", color: "#8ca6b8" }}>
                  <span>🃏 {trilha.flashcards.length} cards</span>
                  <span>·</span>
                  <span>📝 {trilha.questoes.length} questões</span>
                </div>

                <Link
                  href={`/trilhas/${trilha.id}`}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    padding: "9px 16px", borderRadius: "10px", marginTop: "auto",
                    background: "rgba(10,46,69,0.8)", border: "1px solid rgba(140,166,184,0.25)",
                    color: "#f8ecd7", fontSize: "13px", fontWeight: 700, textDecoration: "none",
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
