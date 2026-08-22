"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { get } from 'idb-keyval';
import Link from 'next/link';
import { ClipboardList, FileText, Brain, GraduationCap, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLocalCourses } from '@/hooks/useLocalCourses';
import styles from './Dashboard.module.css';

interface DashboardInsight {
  subject: string;
  pctAcerto: number;
  courseId: string;
}

export default function Dashboard() {
  const { courses, isHydrated } = useLocalCourses();
  const [insight, setInsight] = useState<DashboardInsight | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    
    async function calculateInsight() {
      if (courses.length === 0) {
        setIsCalculated(true);
        return;
      }
      
      let lowestAcerto = 101;
      let worstSubject: DashboardInsight | null = null;
      
      for (const course of courses) {
        const prog = await get(`aivur_progress_${course.id}`);
        if (prog && prog.subjects) {
          for (const [subjectName, subjData] of Object.entries(prog.subjects as Record<string, any>)) {
            const historico = Object.values(subjData.historicoQuestoes || {});
            const total = historico.length;
            if (total >= 5) { // Só dar insight se tiver volume mínimo
              const corretas = historico.filter(Boolean).length;
              const pct = Math.round((corretas / total) * 100);
              
              if (pct < lowestAcerto) {
                lowestAcerto = pct;
                worstSubject = { subject: subjectName, pctAcerto: pct, courseId: course.id };
              }
            }
          }
        }
      }
      
      setInsight(worstSubject);
      setIsCalculated(true);
    }
    
    calculateInsight();
  }, [courses, isHydrated]);

  // Animated number wrapper
  const AnimatedNumber = ({ value }: { value: number }) => {
    const [displayVal, setDisplayVal] = useState(value);
    const [highlight, setHighlight] = useState(false);
    
    useEffect(() => {
      if (value !== displayVal) {
        setDisplayVal(value);
        
        // Verifica preferences de reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (!prefersReducedMotion) {
          setHighlight(true);
          const t = setTimeout(() => setHighlight(false), 300);
          return () => clearTimeout(t);
        }
      }
    }, [value, displayVal]);
    
    return (
      <span className={`${styles.animatedNumber} ${highlight ? styles.highlighted : ''}`}>
        {displayVal}
      </span>
    );
  };

  return (
    <div className={styles.dashWrap}>
      <div className="container">
        
        {/* HERO STRIP */}
        <section className={styles.heroStrip}>
          <div className={styles.badge}>
            <Zap width={14} height={14} /> IA Otimizada para Retenção
          </div>
          
          <h1 className={styles.heroTitle}>
            Evolução de alta <br />
            <span className={styles.heroAccent}>performance.</span>
          </h1>
          
          <div className={styles.insightBox} style={{ opacity: isCalculated ? 1 : 0 }}>
            {insight ? (
              <p className={styles.heroSub}>
                Você está com <AnimatedNumber value={insight.pctAcerto} />% de acerto em <strong>{insight.subject}</strong> — focar na revisão para consolidar.
              </p>
            ) : (
              <p className={styles.heroSub}>
                O Mentor AIVUR converte seu edital em um sistema de retenção contínua focado estritamente na sua aprovação.
              </p>
            )}
          </div>
          
          <div className={styles.ctaRow}>
            {insight ? (
              <Link href={`/mentor/${insight.courseId}`} className={styles.btnCta}>
                Revisar {insight.subject} <ArrowRight width={16} height={16} />
              </Link>
            ) : (
              <Link href="/mentor/gerar" className={styles.btnCta}>
                Gerar minha trilha <ArrowRight width={16} height={16} />
              </Link>
            )}
          </div>
        </section>

        {/* PILLARS GRID */}
        <section className={styles.pillarsGrid}>
          {/* Trilhas */}
          <Link href="/mentor" className={styles.pillarCard}>
            <div className={styles.pillarIcon}>
              <GraduationCap width={24} height={24} />
            </div>
            <div className={styles.pillarContent}>
              <h3 className={styles.pillarTitle}>Trilhas de Estudo</h3>
              <p className={styles.pillarDesc}>Cronograma ativo estruturado por IA via edital.</p>
            </div>
            <div className={styles.pillarArrow}><ArrowRight width={18} height={18} /></div>
          </Link>

          {/* Questões */}
          <Link href="/mentor" className={styles.pillarCard}>
            <div className={styles.pillarIcon}>
              <ClipboardList width={24} height={24} />
            </div>
            <div className={styles.pillarContent}>
              <h3 className={styles.pillarTitle}>Caderno de Questões</h3>
              <p className={styles.pillarDesc}>Simulados gerados com justificativa socrática.</p>
            </div>
            <div className={styles.pillarArrow}><ArrowRight width={18} height={18} /></div>
          </Link>

          {/* Material */}
          <Link href="/material" className={styles.pillarCard}>
            <div className={styles.pillarIcon}>
              <FileText width={24} height={24} />
            </div>
            <div className={styles.pillarContent}>
              <h3 className={styles.pillarTitle}>Seu Material</h3>
              <p className={styles.pillarDesc}>Converta PDFs e resumos em flashcards e questões.</p>
            </div>
            <div className={styles.pillarArrow}><ArrowRight width={18} height={18} /></div>
          </Link>

          {/* Redação */}
          <Link href="/mentor" className={styles.pillarCard}>
            <div className={styles.pillarIcon}>
              <Brain width={24} height={24} />
            </div>
            <div className={styles.pillarContent}>
              <h3 className={styles.pillarTitle}>Redação Coach</h3>
              <p className={styles.pillarDesc}>Feedback avançado e reescrita estrutural nota máxima.</p>
            </div>
            <div className={styles.pillarArrow}><ArrowRight width={18} height={18} /></div>
          </Link>
        </section>

        {/* FEATURE STRIP */}
        <section className={styles.featureStrip}>
          <div className={styles.featItem}>
            <ShieldCheck width={16} height={16} className={styles.featIcon} />
            <span>Sem alucinações de IA</span>
          </div>
          <div className={styles.featItem}>
            <Zap width={16} height={16} className={styles.featIcon} />
            <span>Justificativas Socráticas</span>
          </div>
          <div className={styles.featItem}>
            <Brain width={16} height={16} className={styles.featIcon} />
            <span>Retenção Ativa</span>
          </div>
        </section>

      </div>
    </div>
  );
}
