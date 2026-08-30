"use client";

import { Cpu, PlayCircle, Zap } from "lucide-react";
import Link from "next/link";
import styles from "./Hero.module.css";

import { useQuizStore } from "@/store/useQuizStore";
import { useEffect, useState } from "react";

export default function Hero() {
  const mode = useQuizStore((state) => state.mode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isCompact = mounted && mode !== null;

  const openTour = () => {
    // Custom event to trigger the Mascot tour
    window.dispatchEvent(new CustomEvent('aivo-tour'));
  };

  return (
    <section className={`${styles.hero} ${isCompact ? styles.compact : ''}`} data-aivo-anchor="hero">
      <div className={styles.heroBgSvg}></div>
      <div className={`container ${styles.heroContainer}`}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Cpu width={14} height={14} /> Focado em alta conversão de estudos
          </div>
          <h1 className={styles.heroTitleMain}>
            Corte seu tempo de planejamento <br />
            <span className={styles.heroAccent}>pela metade com IA.</span>
          </h1>
          <p className={styles.heroDescriptionMain}>
            Não perca semanas montando planilhas. A inteligência artificial lê seu edital, estrutura todas as matérias e gera um cronograma de estudos focado na sua aprovação em segundos.
          </p>
          <div className={styles.heroCtaGroup}>
            <Link href="/mentor" className={`btn btn-primary btn-large transition-transform duration-150 active:scale-95`} style={{ textDecoration: 'none' }}>
              Iniciar Trilha de Estudos
            </Link>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.heroVisualDashboard}>
            <div className={styles.heroVisualDashboardTitle}>Sessão de hoje</div>

            <div className={styles.heroProgressContainer}>
              <div>
                <div className={styles.heroProgressHeader}>
                  <span className={styles.heroProgressLabel}>Português</span>
                  <span className={styles.heroProgressValueSuccess}>80%</span>
                </div>
                <div className={styles.heroProgressTrack}>
                  <div className={styles.heroProgressBarSuccess}></div>
                </div>
              </div>

              <div>
                <div className={styles.heroProgressHeader}>
                  <span className={styles.heroProgressLabel}>Direito Administrativo</span>
                  <span className={styles.heroProgressValueInfo}>60%</span>
                </div>
                <div className={styles.heroProgressTrack}>
                  <div className={styles.heroProgressBarInfo}></div>
                </div>
              </div>

              <div>
                <div className={styles.heroProgressHeader}>
                  <span className={styles.heroProgressLabel}>Redação</span>
                  <span className={styles.heroProgressValuePending}>Pendente</span>
                </div>
                <div className={styles.heroProgressTrack}>
                  <div className={styles.heroProgressBarPending}></div>
                </div>
              </div>
            </div>

            <div className={styles.heroRecommendation}>
              <div className={styles.heroRecommendationTitle}>
                <Zap width={14} height={14} /> Próxima Recomendação
              </div>
              <p className={styles.heroRecommendationText}>
                Revisar <strong>atos administrativos</strong> antes de iniciar novas questões.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
