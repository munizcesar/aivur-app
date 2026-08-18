"use client";

import styles from "./Wizard.module.css";
import WizardStep1 from "./WizardStep1";
import WizardStep2 from "./WizardStep2";
import WizardStep3 from "./WizardStep3";
import WizardStepRedacao from "./WizardStepRedacao";
import WizardStepAivur360 from "./WizardStepAivur360";
import { useQuizStore } from "@/store/useQuizStore";
import { useEffect, useState } from "react";

export default function Wizard() {
  const storeStep = useQuizStore((state) => state.step);
  const storeMode = useQuizStore((state) => state.mode);
  const setStep = useQuizStore((state) => state.setStep);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Força o client a renderizar exatamente o que o servidor renderiza no primeiro frame
  // para evitar o temido Hydration Mismatch do Zustand Persist.
  const step = mounted ? storeStep : 1;
  const mode = mounted ? storeMode : null;

  return (
    <main 
      id="wizard" 
      className={styles.wizardSection} 
      data-aivo-anchor="wizard"
      // Removemos o visibility: hidden pois o hydration match agora é perfeito
    >
      <div className="container">
        
        <nav className={styles.stepsBar} aria-label="Progresso do configurador">
          <button className={`${styles.stepIndicator} ${step >= 1 ? styles.active : ""}`} onClick={() => setStep(1)} aria-label="Passo 1: Qual seu objetivo?">
            <span className={styles.stepNumber}>1</span>
            <span className={styles.stepLabel}>Qual seu objetivo?</span>
          </button>
          
          <div className={`${styles.stepConnector} ${step >= 2 ? styles.active : ""}`}></div>
          
          <button className={`${styles.stepIndicator} ${step >= 2 ? styles.active : ""}`} aria-label="Passo 2: Configure seu estudo" disabled={step < 2} onClick={() => setStep(2)}>
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepLabel}>Configure seu estudo</span>
          </button>
          
          <div className={`${styles.stepConnector} ${step >= 3 ? styles.active : ""}`}></div>
          
          <button className={`${styles.stepIndicator} ${step >= 3 ? styles.active : ""}`} aria-label="Passo 3: Pronto pra começar?" disabled={step < 3}>
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepLabel}>Pronto pra começar?</span>
          </button>
        </nav>

        <div className={styles.wizardCard} role="region" aria-live="polite">
          {step === 1 && <WizardStep1 />}
          {step === 2 && <WizardStep2 />}
          {step === 3 && mode === 'redacao' && <WizardStepRedacao />}
          {step === 3 && mode === 'aivos360' && <WizardStepAivur360 />}
          {step === 3 && mode !== 'redacao' && mode !== 'aivos360' && <WizardStep3 />}
        </div>
      </div>
    </main>
  );
}
