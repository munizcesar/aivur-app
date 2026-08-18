import { useEffect, useState } from "react";
import { useQuizStore } from "@/store/useQuizStore";
import { useAivur360 } from "@/hooks/useAivur360";
import { Brain, ChevronLeft, Calendar, Compass, AlertTriangle } from "lucide-react";
import styles from "./Wizard.module.css";

export default function WizardStepAivur360() {
  const freeStudy = useQuizStore((state) => state.freeStudy);
  const setStep = useQuizStore((state) => state.setStep);
  
  const { loading, error, plan, progress, progressMsg, generatePlan, cancelPlanner } = useAivur360();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted && freeStudy.text) {
      try {
        const config = JSON.parse(freeStudy.text);
        setHasStarted(true);
        generatePlan(config);
      } catch(e) {
        // Fallback or error handling
      }
    }
  }, [hasStarted, freeStudy.text, generatePlan]);

  const handleBack = () => {
    cancelPlanner();
    setStep(2);
  };

  if (loading) {
    return (
      <div className={styles.wizardStep}>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <Compass width={48} height={48} color="var(--color-primary)" style={{ animation: "pulse 2s infinite", marginBottom: "24px" }} />
          <h2 style={{ fontSize: "1.5rem", marginBottom: "16px", color: "var(--color-text)" }}>Gerando Planejamento AIVUR 360</h2>
          
          <div style={{ maxWidth: "500px", margin: "0 auto", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
              <span>{progressMsg}</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: "8px", background: "var(--color-surface-offset)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--color-primary)", width: `${progress}%`, transition: "width 0.5s ease-out" }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wizardStep}>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <AlertTriangle width={48} height={48} color="var(--color-error)" style={{ marginBottom: "24px" }} />
          <h2 style={{ fontSize: "1.5rem", marginBottom: "16px", color: "var(--color-error)" }}>Ops, algo deu errado</h2>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "32px" }}>{error}</p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <button className="btn btn-secondary" onClick={handleBack}>Voltar</button>
            <button className="btn btn-primary" onClick={() => {
              if (freeStudy.text) generatePlan(JSON.parse(freeStudy.text));
            }}>Tentar Novamente</button>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className={styles.wizardStep}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <button className="btn btn-secondary" onClick={handleBack} style={{ padding: "8px 12px" }}>
          <ChevronLeft width={18} height={18} /> Novo Planejamento
        </button>
        <div style={{ fontWeight: 600, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Compass width={20} height={20} /> AIVUR 360
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg, oklch(from var(--color-primary) l c h / 0.1) 0%, oklch(from var(--color-primary) l c h / 0.02) 100%)", padding: "32px", borderRadius: "12px", border: "1px solid var(--color-primary)", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.5rem", color: "var(--color-primary)", marginBottom: "8px" }}>Seu Plano de Batalha</h2>
        <p style={{ color: "var(--color-text)", lineHeight: 1.6 }}>O AIVUR 360 estruturou sua rota até a prova. Siga as recomendações de hiperfoco abaixo para maximizar sua retenção.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginBottom: "32px" }}>
        {/* Áreas de Foco */}
        <div style={{ background: "var(--color-surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text)", marginBottom: "16px" }}>
            <Brain width={20} height={20} /> Áreas de Hiperfoco
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {plan.focusAreas?.map((area, i) => (
              <span key={i} style={{ padding: "6px 12px", background: "var(--color-surface-offset)", borderRadius: "20px", fontSize: "0.9rem", color: "var(--color-text)" }}>
                {area}
              </span>
            ))}
          </div>
        </div>

        {/* Cronograma Diário */}
        <div style={{ background: "var(--color-surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text)", marginBottom: "20px" }}>
            <Calendar width={20} height={20} /> Cronograma Diário
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {plan.dailySchedule?.map((day, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px", paddingBottom: "16px", borderBottom: i < plan.dailySchedule.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "var(--color-text)" }}>{day.day}</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{day.hours}h recomendadas</span>
                </div>
                <div style={{ fontSize: "0.95rem", color: "var(--color-text-muted)" }}>
                  {day.subjects.join(" • ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
