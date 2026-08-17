import React from 'react';
import { FileText, WifiOff } from 'lucide-react';
import styles from './Marketing.module.css';

export default function Marketing() {
  return (
    <>
      <section className={`${styles.marketingSection} ${styles.marketingSectionBg}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>Feito para estudantes reais</p>
            <h2>Por que escolher o Mentor AIVUR?</h2>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginTop: "3rem" }}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "2.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", transition: "transform 0.2s" }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.1)", width: "60px", height: "60px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                <FileText width={28} height={28} />
              </div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "1rem" }}>Liberdade Total</h3>
              <p style={{ color: "#94a3b8", lineHeight: "1.6", fontSize: "1.05rem" }}>Cole o edital completo para um planejamento de longo prazo, ou gere uma trilha rápida para aquela matéria específica que você precisa revisar hoje. A IA se adapta ao seu momento.</p>
            </div>

            <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "2.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", transition: "transform 0.2s" }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.1)", width: "60px", height: "60px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                <WifiOff width={28} height={28} />
              </div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "1rem" }}>Estude em Qualquer Lugar</h3>
              <p style={{ color: "#94a3b8", lineHeight: "1.6", fontSize: "1.05rem" }}>Sem internet no ônibus? Sem problema. Seu progresso é salvo instantaneamente no seu dispositivo e sincronizado na nuvem assim que você conectar novamente.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
