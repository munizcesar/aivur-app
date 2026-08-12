import { useEffect, useState } from "react";
import { useQuizStore } from "@/store/useQuizStore";
import { useRedacaoCoach } from "@/hooks/useRedacaoCoach";
import { Brain, ChevronLeft, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import styles from "./Wizard.module.css";

export default function WizardStepRedacao() {
  const filters = useQuizStore((state) => state.filters);
  const freeStudy = useQuizStore((state) => state.freeStudy);
  const setStep = useQuizStore((state) => state.setStep);
  
  const { loading, error, result, progressMsg, gradeEssay, cancelGrader } = useRedacaoCoach();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted && freeStudy.text) {
      setHasStarted(true);
      gradeEssay(freeStudy.text, filters.banca || 'ENEM');
    }
  }, [hasStarted, freeStudy.text, filters.banca, gradeEssay]);

  const handleBack = () => {
    cancelGrader();
    setStep(2);
  };

  if (loading) {
    return (
      <div className={styles.wizardStep}>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <Brain width={48} height={48} color="var(--color-primary)" style={{ animation: "pulse 2s infinite", marginBottom: "24px" }} />
          <h2 style={{ fontSize: "1.5rem", marginBottom: "16px", color: "var(--color-text)" }}>Análise em Progresso</h2>
          
          <div style={{ background: "var(--color-surface-offset)", padding: "16px", borderRadius: "8px", maxWidth: "400px", margin: "0 auto 32px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid var(--color-border)" }}>
            <Loader2 width={20} height={20} color="var(--color-primary)" style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontWeight: 500, color: "var(--color-text)" }}>{progressMsg}</span>
          </div>

          <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "left", opacity: 0.6 }}>
            <div style={{ height: "16px", background: "var(--color-border)", borderRadius: "4px", width: "100%", marginBottom: "12px", animation: "pulse 1.5s infinite" }}></div>
            <div style={{ height: "16px", background: "var(--color-border)", borderRadius: "4px", width: "90%", marginBottom: "12px", animation: "pulse 1.5s infinite 0.2s" }}></div>
            <div style={{ height: "16px", background: "var(--color-border)", borderRadius: "4px", width: "95%", marginBottom: "32px", animation: "pulse 1.5s infinite 0.4s" }}></div>
            <div style={{ height: "16px", background: "var(--color-border)", borderRadius: "4px", width: "80%", marginBottom: "12px", animation: "pulse 1.5s infinite 0.6s" }}></div>
            <div style={{ height: "16px", background: "var(--color-border)", borderRadius: "4px", width: "85%", animation: "pulse 1.5s infinite 0.8s" }}></div>
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
            <button className="btn btn-primary" onClick={() => gradeEssay(freeStudy.text || '', filters.banca || 'ENEM')}>Tentar Novamente</button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const totalScore = (result.scores.c1 || 0) + (result.scores.c2 || 0) + (result.scores.c3 || 0) + (result.scores.c4 || 0) + (result.scores.c5 || 0);

  return (
    <div className={styles.wizardStep}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <button className="btn btn-secondary" onClick={handleBack} style={{ padding: "8px 12px" }}>
          <ChevronLeft width={18} height={18} /> Nova Redação
        </button>
        <div style={{ fontWeight: 600, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Brain width={20} height={20} /> Correção IA
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg, oklch(from var(--color-primary) l c h / 0.1) 0%, oklch(from var(--color-primary) l c h / 0.02) 100%)", padding: "32px", borderRadius: "12px", border: "1px solid var(--color-primary)", marginBottom: "32px", textAlign: "center" }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Nota Final</div>
        <div style={{ fontSize: "4rem", fontWeight: 900, color: "var(--color-text)", lineHeight: 1 }}>
          {totalScore} <span style={{ fontSize: "1.5rem", color: "var(--color-text-muted)", fontWeight: 500 }}>/ 1000</span>
        </div>
      </div>

      <p style={{ fontSize: "1.1rem", lineHeight: 1.6, color: "var(--color-text)", marginBottom: "32px" }}>
        {result.summary}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        <div style={{ background: "var(--color-surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-success)", marginBottom: "16px" }}>
            <CheckCircle2 width={20} height={20} /> Pontos Fortes
          </h3>
          <ul style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {result.strongPoints?.map((p, i) => (
              <li key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "0.95rem", color: "var(--color-text-muted)" }}>
                <div style={{ color: "var(--color-success)", marginTop: "2px" }}>•</div>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ background: "var(--color-surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-error)", marginBottom: "16px" }}>
            <AlertTriangle width={20} height={20} /> O que precisa melhorar
          </h3>
          <ul style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {result.problems?.map((p, i) => (
              <li key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "0.95rem", color: "var(--color-text-muted)" }}>
                <div style={{ color: "var(--color-error)", marginTop: "2px" }}>•</div>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ background: "var(--color-surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)", marginBottom: "32px" }}>
        <h3 style={{ marginBottom: "20px", color: "var(--color-text)" }}>Detalhamento por Competência</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            { id: 'c1', title: 'Competência 1', desc: 'Domínio da norma culta', score: result.scores.c1 },
            { id: 'c2', title: 'Competência 2', desc: 'Compreensão do tema e estrutura', score: result.scores.c2 },
            { id: 'c3', title: 'Competência 3', desc: 'Argumentação e organização das ideias', score: result.scores.c3 },
            { id: 'c4', title: 'Competência 4', desc: 'Coesão e mecanismos linguísticos', score: result.scores.c4 },
            { id: 'c5', title: 'Competência 5', desc: 'Proposta de intervenção', score: result.scores.c5 },
          ].map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px", borderBottom: c.id !== 'c5' ? "1px solid var(--color-border)" : "none" }}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{c.title}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{c.desc}</div>
              </div>
              <div style={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "1.2rem" }}>
                {c.score || 0}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ background: "oklch(from var(--color-accent) l c h / 0.1)", border: "1px solid oklch(from var(--color-accent) l c h / 0.2)", padding: "24px", borderRadius: "12px" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-accent)", marginBottom: "16px" }}>
          <ArrowRight width={20} height={20} /> Próximos Passos
        </h3>
        <ul style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {result.nextSteps?.map((p, i) => (
            <li key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "0.95rem", color: "var(--color-text-muted)" }}>
              <div style={{ color: "var(--color-accent)", marginTop: "2px" }}>•</div>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
