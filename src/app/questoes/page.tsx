"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import WizardStep2 from "@/components/Wizard/WizardStep2";
import WizardStep3 from "@/components/Wizard/WizardStep3";
import { useQuizStore } from "@/store/useQuizStore";
import styles from "@/components/Wizard/Wizard.module.css";

export default function QuestoesPage() {
  const router = useRouter();
  const mode = useQuizStore((state) => state.mode);
  const setMode = useQuizStore((state) => state.setMode);
  const step = useQuizStore((state) => state.step);
  const setStep = useQuizStore((state) => state.setStep);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMode("concurso");
    setStep(2);
  }, [setMode, setStep]);

  if (!mounted) return null;

  return (
    <>
      <Header />
      <main style={{ flex: 1, padding: "2rem 0", minHeight: "85vh", background: "var(--elite-navy, #0A2E45)" }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap-reverse', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--elite-cream, #FBEBD0)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                Caderno de Questões
              </h1>
              <p style={{ color: 'rgba(251,235,208,0.7)', fontSize: '1.1rem' }}>
                Configure sua bateria de questões focada na sua banca e maximize sua retenção.
              </p>
            </div>
            <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end' }}>
              {/*eslint-disable-next-line @next/next/no-img-element*/}
              <img src="/images/aivur/questoes.png" alt="Aivur Questões 3D" style={{ width: '220px', height: 'auto', objectFit: 'contain', background: 'transparent', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.3))' }} />
            </div>
          </div>
          <div className={styles.wizardCard} role="region" aria-live="polite">
            {(step <= 2) && <WizardStep2 />}
            {step >= 3 && <WizardStep3 />}
          </div>
        </div>
      </main>
      <Footer />
      <SideDrawer />
    </>
  );
}
