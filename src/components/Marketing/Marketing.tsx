import React from 'react';
import { Target, Sliders, Sparkles, XCircle, CheckCircle2 } from 'lucide-react';
import styles from './Marketing.module.css';

export default function Marketing() {
  return (
    <>
      <section className={`${styles.marketingSection} ${styles.marketingSectionBg}`}>
        <div className="container">
          <div className={styles.howItWorks}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionEyebrow}>Simples por design</p>
              <h2>Como funciona</h2>
            </div>
            <div className={styles.stepsFlow}>
              <div className={styles.stepItem}>
                <div className={styles.stepVisual}>
                  <span className={styles.stepIcon}><Target width={28} height={28} /></span>
                  <span className={styles.stepNumberBadge}>1</span>
                </div>
                <h3 className={styles.stepTitleFlow}>Qual seu objetivo?</h3>
                <p className={styles.stepDesc}>Concursos, Material Livre, Redação ou Mentor.</p>
              </div>
              
              <div className={styles.flowArrow} aria-hidden="true">
                <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                  <path d="M4 12H26M26 12L20 5M26 12L20 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              <div className={styles.stepItem}>
                <div className={styles.stepVisual}>
                  <span className={styles.stepIcon}><Sliders width={28} height={28} /></span>
                  <span className={styles.stepNumberBadge}>2</span>
                </div>
                <h3 className={styles.stepTitleFlow}>Como estudar?</h3>
                <p className={styles.stepDesc}>Dificuldade, quantidade e tipo em segundos.</p>
              </div>
              
              <div className={styles.flowArrow} aria-hidden="true">
                <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                  <path d="M4 12H26M26 12L20 5M26 12L20 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              <div className={styles.stepItem}>
                <div className={styles.stepVisual}>
                  <span className={styles.stepIcon}><Sparkles width={28} height={28} /></span>
                  <span className={styles.stepNumberBadge}>3</span>
                </div>
                <h3 className={styles.stepTitleFlow}>Estude</h3>
                <p className={styles.stepDesc}>Questões geradas na hora com correção completa.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.marketingSection} ${styles.marketingSectionBg}`}>
        <div className="container">
          <div className={styles.compareTableWrapper}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionEyebrow}>Comparativo</p>
              <h2>Com AIVUR vs. Sem AIVUR</h2>
            </div>
            <table className={styles.compareTable}>
              <thead>
                <tr>
                  <th>Situação</th>
                  <th>
                    <XCircle width={14} height={14} style={{ verticalAlign: "-2px", marginRight: "4px" }} />
                    Sem AIVUR
                  </th>
                  <th>
                    <CheckCircle2 width={14} height={14} style={{ verticalAlign: "-2px", marginRight: "4px" }} />
                    Com AIVUR
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Criar questões</td>
                  <td>15-30 min pensando</td>
                  <td>Menos de 10 segundos</td>
                </tr>
                <tr>
                  <td>Relevância</td>
                  <td>Genérico e vago</td>
                  <td>Específico para seu concurso/matéria</td>
                </tr>
                <tr>
                  <td>Nível das questões</td>
                  <td>Aleatório</td>
                  <td>Calibrado pela dificuldade escolhida</td>
                </tr>
                <tr>
                  <td>Gabarito</td>
                  <td>Sem explicação</td>
                  <td>Comentado com justificativa</td>
                </tr>
                <tr>
                  <td>Custo</td>
                  <td>Pago (cursinhos)</td>
                  <td>Acessível</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
