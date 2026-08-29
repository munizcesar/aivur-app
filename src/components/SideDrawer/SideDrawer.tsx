"use client";

import { useState, useRef } from "react";
import { useQuizStore } from "@/store/useQuizStore";
import { 
  GraduationCap, X, LayoutDashboard, History, Zap, Sparkles, 
  Flame, BarChart3, Clock, ClipboardList, FileText, Brain 
} from "lucide-react";
import styles from "./SideDrawer.module.css";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SideDrawer() {
  const isDrawerOpen = useQuizStore((state) => state.isDrawerOpen);
  const setDrawerOpen = useQuizStore((state) => state.setDrawerOpen);
  const setMode = useQuizStore((state) => state.setMode);
  const setStep = useQuizStore((state) => state.setStep);
  const answered = useQuizStore((state) => state.answered);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"resumo" | "historico" | "atalhos" | "mentor">("resumo");
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const closeDrawer = () => setDrawerOpen(false);

  const startShortcut = (mode: "concurso" | "livre" | "redacao") => {
    setMode(mode);
    setStep(2);
    closeDrawer();
    router.push('/');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;
    
    // Swipe horizontal maior que 50px e superior ao movimento vertical
    if (diffX > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      closeDrawer();
      touchStartX.current = null;
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`${styles.drawerOverlay} ${isDrawerOpen ? styles.open : ""}`} 
        onClick={closeDrawer}
        role="dialog" 
        aria-modal="true"
      ></div>

      {/* Drawer */}
      <aside 
        className={`${styles.sideDrawer} ${isDrawerOpen ? styles.open : ""}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeaderLeft}>
            <span className={styles.drawerLogo}>
              <GraduationCap width={22} height={22} />
            </span>
            <span className={styles.drawerTitle}>Painel de Estudo</span>
          </div>
          <button className={styles.closeBtn} onClick={closeDrawer} aria-label="Fechar painel">
            <X width={20} height={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.drawerTabs}>
          <button 
            className={`${styles.drawerTab} ${activeTab === "resumo" ? styles.active : ""}`}
            onClick={() => setActiveTab("resumo")}
          >
            <LayoutDashboard width={16} height={16} />
            <span>Resumo</span>
          </button>
          <button 
            className={`${styles.drawerTab} ${activeTab === "historico" ? styles.active : ""}`}
            onClick={() => setActiveTab("historico")}
          >
            <History width={16} height={16} />
            <span>Histórico</span>
          </button>
          <button 
            className={`${styles.drawerTab} ${activeTab === "atalhos" ? styles.active : ""}`}
            onClick={() => setActiveTab("atalhos")}
          >
            <Zap width={16} height={16} />
            <span>Atalhos</span>
          </button>
          <button 
            className={`${styles.drawerTab} ${activeTab === "mentor" ? styles.active : ""}`}
            onClick={() => setActiveTab("mentor")}
          >
            <Sparkles width={16} height={16} />
            <span>Mentor</span>
          </button>
        </div>

        <div className={styles.drawerBody}>
          {/* Resumo Panel */}
          <div className={`${styles.drawerPanel} ${activeTab === "resumo" ? styles.active : ""}`}>
            <div className={styles.drawerStreakCard}>
              <div className={styles.drawerStreakIcon}><Flame width={26} height={26} fill="currentColor" /></div>
              <div className={styles.drawerStreakInfo}>
                <span className={styles.drawerStreakCount}>1</span>
                <span className={styles.drawerStreakLabel}>dia de sequência</span>
              </div>
            </div>

            <div className={styles.drawerPanelHeader}>
              <div className={styles.rsSectionTitle}>
                <BarChart3 width={14} height={14} /> Desempenho Hoje
              </div>
              <span className={styles.drawerLiveBadge}>
                <span className={styles.drawerLiveDot}></span> Hoje
              </span>
            </div>

            <div className={styles.drawerMetricsGrid}>
              <div className={`${styles.drawerMetric} ${styles.metricTotal}`}>
                <span className={styles.drawerMetricValue}>{answered}</span>
                <span className={styles.drawerMetricLabel}>Questões</span>
              </div>
              <div className={`${styles.drawerMetric} ${styles.metricCorrect}`}>
                <span className={styles.drawerMetricValue}>0</span>
                <span className={styles.drawerMetricLabel}>Acertos</span>
              </div>
              <div className={`${styles.drawerMetric} ${styles.metricWrong}`}>
                <span className={styles.drawerMetricValue}>0</span>
                <span className={styles.drawerMetricLabel}>Erros</span>
              </div>
            </div>

            <div className={styles.drawerAccRow}>
              <div className={styles.drawerAccLabel}>Aproveitamento</div>
              <div className={styles.drawerAccValue}>0%</div>
            </div>
          </div>

          {/* Histórico Panel */}
          <div className={`${styles.drawerPanel} ${activeTab === "historico" ? styles.active : ""}`}>
            <div className={styles.drawerPanelHeader}>
              <div className={styles.rsSectionTitle}><Clock width={14} height={14} /> Sessões Recentes</div>
            </div>
            <div className={styles.drawerHistoryList}>
              <div className={styles.drawerEmpty}>
                Nenhuma sessão salva ainda. <br/>Resolva questões para ver seu histórico.
              </div>
            </div>
          </div>

          {/* Atalhos Panel */}
          <div className={`${styles.drawerPanel} ${activeTab === "atalhos" ? styles.active : ""}`}>
            <div className={styles.drawerPanelHeader}>
              <div className={styles.rsSectionTitle}><Zap width={14} height={14} /> Ações Rápidas</div>
            </div>
            <div className={styles.drawerActionsList}>
              <Link href="/mentor/gerar" onClick={closeDrawer} className={styles.drawerActionBtn} style={{ minHeight: '60px', background: 'var(--color-surface)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <span className={styles.drawerActionIcon} style={{ background: 'rgba(217, 107, 84, 0.1)', color: '#D96B54' }}>
                  <GraduationCap width={22} height={22} />
                </span>
                <span className={styles.drawerActionText}>
                  <strong style={{ color: '#2B4C5F' }}>Trilhas de Estudo</strong>
                  <span>Cronograma via edital</span>
                </span>
              </Link>
              
              <Link href="/questoes" onClick={closeDrawer} className={styles.drawerActionBtn} style={{ minHeight: '60px', background: 'var(--color-surface)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <span className={styles.drawerActionIcon} style={{ background: 'rgba(122, 154, 140, 0.1)', color: '#7A9A8C' }}>
                  <ClipboardList width={22} height={22} />
                </span>
                <span className={styles.drawerActionText}>
                  <strong style={{ color: '#2B4C5F' }}>Caderno de Questões</strong>
                  <span>Filtre por banca e cargo</span>
                </span>
              </Link>

              <Link href="/material" onClick={closeDrawer} className={styles.drawerActionBtn} style={{ minHeight: '60px', background: 'var(--color-surface)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <span className={styles.drawerActionIcon} style={{ background: 'rgba(217, 107, 84, 0.1)', color: '#D96B54' }}>
                  <FileText width={22} height={22} />
                </span>
                <span className={styles.drawerActionText}>
                  <strong style={{ color: '#2B4C5F' }}>Meu Material</strong>
                  <span>Transforme material em questões</span>
                </span>
              </Link>

              <Link href="/redacao" onClick={closeDrawer} className={styles.drawerActionBtn} style={{ minHeight: '60px', background: 'var(--color-surface)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <span className={styles.drawerActionIcon} style={{ background: 'rgba(122, 154, 140, 0.1)', color: '#7A9A8C' }}>
                  <Brain width={22} height={22} />
                </span>
                <span className={styles.drawerActionText}>
                  <strong style={{ color: '#2B4C5F' }}>Redação Coach</strong>
                  <span>Correção completa C1 a C5</span>
                </span>
              </Link>
            </div>
          </div>

          {/* Mentor Panel */}
          <div className={`${styles.drawerPanel} ${activeTab === "mentor" ? styles.active : ""}`}>
            <div className={styles.drawerPanelHeader}>
              <div className={styles.rsSectionTitle}><Sparkles width={14} height={14} /> Mentor IA</div>
            </div>
            <div className={styles.drawerEmpty} style={{ border: "none", background: "transparent", marginTop: "20px" }}>
              <Brain width={40} height={40} color="var(--color-primary)" style={{ opacity: 0.5, margin: "0 auto 16px" }} />
              O módulo de Mentor (AIVUR 360) será implementado na fase final da migração.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
