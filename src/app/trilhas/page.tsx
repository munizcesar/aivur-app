import type { Metadata } from "next";
import { Sparkles, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import TrilhasAccordion from "@/components/Cockpit/TrilhasAccordion";
import TrilhaSelector from "@/components/Cockpit/parts/TrilhaSelector";
import { TRILHAS_CATALOG } from "@/data/trilhas/schema";
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
                  <button className={styles.primaryAction} type="button">
                    <Sparkles size={18} aria-hidden="true" />
                    Gerar trilha com IA
                  </button>
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
      </main>
      <Footer />
      <SideDrawer />
    </div>
  );
}
