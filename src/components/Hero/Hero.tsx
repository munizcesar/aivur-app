"use client";

import { Cpu, PlayCircle, Zap } from "lucide-react";
import styles from "./Hero.module.css";

export default function Hero() {
  const openTour = () => {
    // Custom event to trigger the Mascot tour
    window.dispatchEvent(new CustomEvent('aivo-tour'));
  };

  return (
    <section className={styles.hero} data-aivo-anchor="hero">
      <div className={styles.heroBgSvg}></div>
      <div className={`container ${styles.heroContainer}`}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Cpu width={14} height={14} /> Tecnologia aplicada à preparação para concursos
          </div>
          <h1 className={styles.heroTitleMain}>
            Estude com um mentor que <br />
            <span className={styles.heroAccent}>evolui junto com você.</span>
          </h1>
          <p className={styles.heroDescriptionMain}>
            Questões personalizadas, correção de redações por critérios da banca, planejamento adaptativo e acompanhamento contínuo em um único ambiente de estudos.
          </p>
          <div className={styles.heroCtaGroup}>
            <button className={`btn btn-primary btn-large`} onClick={openTour}>
              Tour com o Mascote <PlayCircle width={20} height={20} />
            </button>
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
