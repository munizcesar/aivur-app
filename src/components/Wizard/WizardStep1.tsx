"use client";

import { useState } from "react";
import { ClipboardList, FileText, Brain, GraduationCap, Check, X as XIcon, Lightbulb } from "lucide-react";
import styles from "./WizardStep1.module.css";

import { useQuizStore, Mode } from "@/store/useQuizStore";

export default function WizardStep1() {
  const mode = useQuizStore((state) => state.mode);
  const setMode = useQuizStore((state) => state.setMode);
  const setStep = useQuizStore((state) => state.setStep);

  const handleSelectMode = (selectedMode: Mode) => {
    setMode(selectedMode);
    
    // Scroll to wizard
    const wizardEl = document.getElementById('wizard');
    if (wizardEl) {
      wizardEl.scrollIntoView({ behavior: 'smooth' });
    }

    // Delay for visual feedback
    setTimeout(() => {
      setStep(2);
    }, 150);
  };

  return (
    <div className={styles.wizardStep}>
      <h2 className={styles.stepTitle}>Como você quer estudar hoje?</h2>
      <p className={styles.stepSubtitle}>Escolha o modo ideal para o seu objetivo de hoje</p>
      
      <div className={styles.modeGrid}>
        {/* Resolver Questões */}
        <button 
          type="button" 
          className={`${styles.modeCard} ${mode === 'concurso' ? styles.selected : ''}`}
          onClick={() => handleSelectMode('concurso')}
          aria-label="Caderno de Questões"
        >
          <div className={styles.modeIconWrapper}>
            <ClipboardList width={28} height={28} />
          </div>
          <div className={styles.modeInfo}>
            <strong>Resolver Questões</strong>
            <span className={styles.modeSubtitle}>Pratique diariamente. Filtre questões por matéria, banca e cargo com múltipla escolha ou Certo/Errado.</span>
          </div>
          
          <ul className={styles.modeBenefits}>
            <li>
              <div className={styles.benefitCheck}><Check width={14} height={14} strokeWidth={3} /></div>
              Crie simulados personalizados em segundos
            </li>
            <li>
              <div className={styles.benefitCheck}><Check width={14} height={14} strokeWidth={3} /></div>
              Questões com gabarito comentado e explicação detalhada
            </li>
            <li>
              <div className={styles.benefitCheck}><Check width={14} height={14} strokeWidth={3} /></div>
              Acompanhe seu progresso e foque no que precisa melhorar
            </li>
          </ul>

          <div className={styles.modeTip}>
            <Lightbulb width={16} height={16} strokeWidth={2.5} />
            <span><strong>Dica:</strong> monte simulados de 20 questões para treinar resistência.</span>
          </div>
        </button>

        {/* Estudar com seu Material */}
        <button 
          type="button" 
          className={`${styles.modeCard} ${mode === 'livre' ? styles.selected : ''}`}
          onClick={() => handleSelectMode('livre')}
          aria-label="Estudar com seu Material"
        >
          <div className={styles.modeIconWrapper}>
            <FileText width={28} height={28} />
          </div>
          <div className={styles.modeInfo}>
            <strong>Estudar com seu Material</strong>
            <span className={styles.modeSubtitle}>Transforme PDFs, editais e resumos em estudo ativo e focado.</span>
          </div>
          
          <ul className={styles.modeBenefits}>
            <li>
              <div className={styles.benefitCheck}><Check width={14} height={14} strokeWidth={3} /></div>
              Cole edital, PDF, resumo ou transcrição de vídeo
            </li>
            <li>
              <div className={styles.benefitCheck}><Check width={14} height={14} strokeWidth={3} /></div>
              Gere questões focadas exclusivamente no seu material
            </li>
            <li>
              <div className={styles.benefitCheck}><Check width={14} height={14} strokeWidth={3} /></div>
              Complemente seu cursinho ou apostila
            </li>
          </ul>

          <div className={styles.modeTip}>
            <Lightbulb width={16} height={16} strokeWidth={2.5} />
            <span><strong>Dica:</strong> cole o texto completo do edital ou resumo para questões mais precisas.</span>
          </div>
        </button>

        {/* Redação */}
        <button 
          type="button" 
          className={`${styles.modeCard} ${mode === 'redacao' ? styles.selected : ''}`}
          onClick={() => handleSelectMode('redacao')}
          aria-label="Redação Coach"
        >
          <div className={styles.modeIconWrapper}>
            <Brain width={28} height={28} />
          </div>
          <div className={styles.modeInfo}>
            <strong>Redação</strong>
            <span className={styles.modeSubtitle}>Evolua sua escrita com feedback estruturado, recebendo orientação para nota 1000.</span>
          </div>
          
          <ul className={styles.modeBenefits}>
            <li>
              <div className={styles.benefitCheck}><Check width={14} height={14} strokeWidth={3} /></div>
              Escreva sua redação passo a passo com orientação da IA
            </li>
            <li>
              <div className={styles.benefitCheck}><Check width={14} height={14} strokeWidth={3} /></div>
              Correção completa de C1 a C5 no estilo da banca
            </li>
            <li>
              <div className={styles.benefitCheck}><Check width={14} height={14} strokeWidth={3} /></div>
              Receba reescrita otimizada para atingir nota máxima
            </li>
          </ul>

          <div className={styles.modeTip}>
            <Lightbulb width={16} height={16} strokeWidth={2.5} />
            <span><strong>Dica:</strong> pratique 1 redação por semana para evoluir sua nota gradativamente.</span>
          </div>
        </button>

        {/* Mentor de Estudos */}
        <button 
          type="button" 
          className={`${styles.modeCard} ${mode === 'aivos360' ? styles.selected : ''}`}
          onClick={() => handleSelectMode('aivos360')}
          aria-label="Mentor Class"
        >
          <div className={styles.modeIconWrapper}>
            <GraduationCap width={28} height={28} />
          </div>
          <div className={styles.modeInfo}>
            <strong>Mentor de Estudos</strong>
            <span className={styles.modeSubtitle}>Seu mentor IA que analisa cada questão e traça a rota mais rápida para aprovação.</span>
          </div>
          
          <ul className={styles.modeBenefits}>
            <li>
              <div className={styles.benefitCheck}><Check width={14} height={14} strokeWidth={3} /></div>
              Visualize sua probabilidade de aprovação e nível de domínio
            </li>
            <li>
              <div className={styles.benefitCheck}><Check width={14} height={14} strokeWidth={3} /></div>
              Identifique riscos e oportunidades por disciplina
            </li>
            <li>
              <div className={styles.benefitCheck}><Check width={14} height={14} strokeWidth={3} /></div>
              Receba plano de estudo com recomendações diárias
            </li>
          </ul>

          <div className={styles.modeTip}>
            <Lightbulb width={16} height={16} strokeWidth={2.5} />
            <span><strong>Dica:</strong> preencha o diagnóstico completo para um plano impecável.</span>
          </div>
        </button>
      </div>
    </div>
  );
}
