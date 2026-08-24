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
    if (step < 2) {
      setStep(2);
    }
  }, [setMode, setStep, step]);

  if (!mounted) return null;

  return (
    <>
      <Header />
      <main style={{ flex: 1, padding: "2rem 0", minHeight: "85vh", background: "var(--elite-navy, #0A2E45)" }}>
        <div className="container">
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

