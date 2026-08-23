"use client";

import React, { useEffect, useState } from 'react';
import { get } from 'idb-keyval';
import Link from 'next/link';
import {
  ClipboardList,
  FileText,
  Brain,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
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
          for (const [subjectName, subjData] of Object.entries(
            prog.subjects as Record<string, any>
          )) {
            const historico = Object.values(subjData.historicoQuestoes || {});
            const total = historico.length;
            if (total >= 5) {
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

        {/* ── HERO STRIP — Layout assimétrico 3fr / 2fr ── */}
        <section className={styles.heroStrip}>

          {/* Coluna esquerda: headline + subtexto + CTA */}
          <div className={styles.heroLeft}>
            {/* Eyebrow — sem badge-pílula; linha decorativa + texto corrido */}
            <p className={styles.heroEyebrow}>Preparação para Concursos &amp; Vestibulares</p>

            {/* Headline com peso editorial, cor sólida — sem split colorido */}
            <h1 className={styles.heroTitle}>
              {insight
                ? 'Hora de consolidar o que falta.'
                : 'Estude com precisão cirúrgica.'}
            </h1>

            {/* Subtexto forte */}
            <div className={styles.insightBox} style={{ opacity: isCalculated ? 1 : 0 }}>
              {insight ? (
                <p className={styles.heroSub}>
                  Você está com{' '}
                  <AnimatedNumber value={insight.pctAcerto} />% de acerto em{' '}
                  <strong>{insight.subject}</strong>. Foque na revisão para consolidar e avançar.
                </p>
              ) : (
                <p className={styles.heroSub}>
                  O Mentor AIVUR lê seu edital, estrutura todas as matérias e converte seu tempo
                  em aprovação — não em planilha.
                </p>
              )}
            </div>

            {/* CTA — retângulo rígido com sombra sólida offset, sem pill, sem gradiente */}
            <div className={styles.ctaRow}>
              {insight ? (
                <Link href={`/mentor/${insight.courseId}`} className={styles.btnCta}>
                  Revisar {insight.subject}
                  <ArrowRight width={16} height={16} />
                </Link>
              ) : (
                <Link href="/mentor/gerar" className={styles.btnCta}>
                  Gerar minha trilha
                  <ArrowRight width={16} height={16} />
                </Link>
              )}
            </div>
          </div>

          {/* Coluna direita: espaço reservado para mascote Aivo / preview real */}
          <div className={styles.heroRight}>
            <div className={styles.heroVisualPlaceholder} aria-hidden="true">
              <span className={styles.heroVisualLabel}>Aivo — em breve</span>
            </div>
          </div>
        </section>

        {/* ── PILLARS — Layout editorial assimétrico (sem grid uniforme 2×2) ── */}
        <section className={styles.pillarsSection} aria-label="Ferramentas de estudo">
          <p className={styles.pillarsLabel}>Plataforma</p>

          <div className={styles.pillarsLayout}>
            {/* Card destaque: Trilhas de Estudo ocupa linha inteira */}
            <Link
              href="/mentor/gerar"
              className={`${styles.pillarCard} ${styles.pillarCardFeatured}`}
            >
              <div className={styles.pillarIcon}>
                <GraduationCap width={22} height={22} />
              </div>
              <div className={styles.pillarContent}>
                <h3 className={styles.pillarTitle}>Trilhas de Estudo</h3>
                <p className={styles.pillarDesc}>
                  Cronograma ativo estruturado por IA a partir do seu edital ou tema livre.
                </p>
              </div>
              <div className={styles.pillarArrow}>
                <ArrowRight width={18} height={18} />
              </div>
            </Link>

            {/* Cards secundários em lista */}
            <Link href="/questoes" className={styles.pillarCard}>
              <div className={styles.pillarIcon}>
                <ClipboardList width={20} height={20} />
              </div>
              <div className={styles.pillarContent}>
                <h3 className={styles.pillarTitle}>Caderno de Questões</h3>
                <p className={styles.pillarDesc}>
                  Simulados com justificativa socrática por matéria e banca.
                </p>
              </div>
              <div className={styles.pillarArrow}>
                <ArrowRight width={18} height={18} />
              </div>
            </Link>

            <Link href="/material" className={styles.pillarCard}>
              <div className={styles.pillarIcon}>
                <FileText width={20} height={20} />
              </div>
              <div className={styles.pillarContent}>
                <h3 className={styles.pillarTitle}>Seu Material</h3>
                <p className={styles.pillarDesc}>
                  Converta PDFs e resumos em flashcards e questões instantaneamente.
                </p>
              </div>
              <div className={styles.pillarArrow}>
                <ArrowRight width={18} height={18} />
              </div>
            </Link>

            <Link href="/redacao" className={styles.pillarCard}>
              <div className={styles.pillarIcon}>
                <Brain width={20} height={20} />
              </div>
              <div className={styles.pillarContent}>
                <h3 className={styles.pillarTitle}>Redação Coach</h3>
                <p className={styles.pillarDesc}>
                  Feedback estrutural avançado e reescrita orientada à nota máxima.
                </p>
              </div>
              <div className={styles.pillarArrow}>
                <ArrowRight width={18} height={18} />
              </div>
            </Link>
          </div>
        </section>

        {/* ── FEATURE STRIP — rodapé editorial em texto corrido ── */}
        <section className={styles.featureStrip} aria-label="Diferenciais">
          <div className={styles.featItem}>
            <ShieldCheck width={14} height={14} className={styles.featIcon} />
            <span>Sem alucinações de IA</span>
          </div>
          <div className={styles.featItem}>
            <Zap width={14} height={14} className={styles.featIcon} />
            <span>Justificativas Socráticas</span>
          </div>
          <div className={styles.featItem}>
            <Brain width={14} height={14} className={styles.featIcon} />
            <span>Retenção Ativa</span>
          </div>
        </section>

      </div>
    </div>
  );
}
