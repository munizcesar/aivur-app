"use client";

import React, { useEffect, useState, useRef } from "react";
import { useQuizStore } from "@/store/useQuizStore";
import { AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, XCircle, X, Brain, RotateCcw, BookOpen } from "lucide-react";
import styles from "./Wizard.module.css";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://aivur-worker.cesarmuniz0816.workers.dev';

export default function WizardStep3() {
  const mode = useQuizStore((state) => state.mode);
  const filters = useQuizStore((state) => state.filters);
  const freeStudy = useQuizStore((state) => state.freeStudy);
  const setStep = useQuizStore((state) => state.setStep);
  const generatedQuestions = useQuizStore((state) => state.generatedQuestions);
  const setGeneratedQuestions = useQuizStore((state) => state.setGeneratedQuestions);
  
  const [loading, setLoading] = useState(!generatedQuestions.length);
  const [error, setError] = useState<string | null>(null);
  
  // Quiz state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<(string | null)[]>([]);
  const [results, setResults] = useState<(boolean | null)[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // History API Interception
  useEffect(() => {
    // Only intercept if we are actually showing questions
    if (!loading && !error && generatedQuestions.length > 0) {
      window.history.pushState({ quizActive: true }, "");

      const handlePopState = (e: PopStateEvent) => {
        // User pressed back button
        e.preventDefault();
        setShowExitModal(true);
        // Push state again so they don't actually leave the page
        window.history.pushState({ quizActive: true }, "");
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [loading, error, generatedQuestions]);

  useEffect(() => {
    if (generatedQuestions.length === 0 && !error) {
      generateQuestions();
    } else {
      // If questions exist from a previous session, initialize states
      if (selectedOptions.length === 0) {
        setSelectedOptions(new Array(generatedQuestions.length).fill(null));
        setResults(new Array(generatedQuestions.length).fill(null));
      }
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Run only once on mount

  const generateQuestions = async () => {
    setLoading(true);
    setError(null);
    
    abortControllerRef.current = new AbortController();
    
    let filterKey = null;
    if (mode === 'concurso' && filters.materia && filters.materia !== 'Todas') {
      filterKey = `concursos.${filters.materia}`;
    }

    const payload = {
      mode: mode,
      filter: filterKey,
      topic: filters.assunto !== 'Todos' ? filters.assunto : null,
      banca: filters.banca !== 'Todas' ? filters.banca : null,
      concurso: filters.orgao !== 'Todos' ? filters.orgao : null,
      cargo: filters.cargo !== 'Todos' ? filters.cargo : null,
      ano: filters.ano !== 'Todos' ? filters.ano : null,
      nivel: filters.nivel !== 'Todos' ? filters.nivel : null,
      freeText: freeStudy.text,
      editalText: useQuizStore.getState().editalText,
      difficulty: filters.dificuldade,
      quantity: filters.quantidade,
      questionType: filters.tipoQuestao,
      idioma: "pt-BR",
      sessionMode: "normal"
    };

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal
      });

      let rawText = '';
      try {
        rawText = await res.text();
      } catch (e) {
        throw new Error("Falha ao ler resposta da rede.");
      }
      
      let data;
      try {
        data = JSON.parse(rawText) as { success?: boolean; userMessage?: string; questions?: unknown[], error?: string };
      } catch (e) {
        throw new Error(`[JSON_PARSE_ERROR]: ${rawText.substring(0, 150)}`);
      }
      
      if (!res.ok) throw new Error(data.error || data.userMessage || `Erro HTTP ${res.status} - ${rawText.substring(0, 100)}`);
      if (data.success === false) throw new Error(data.error || data.userMessage || 'Falha ao processar requisição.');
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        console.error("ERRO NA API DE QUESTÕES: O payload retornado não contém um Array válido de questões.", data);
        throw new Error(data.userMessage || 'O formato da resposta não é válido ou nenhuma questão foi retornada.');
      }

      setGeneratedQuestions(data.questions as any[]);
      setSelectedOptions(new Array(data.questions.length).fill(null));
      setResults(new Array(data.questions.length).fill(null));
      setCurrentIdx(0);
      setLoading(false);
    } catch (err: any) {
      console.error("ERRO NA API DE QUESTÕES:", err);
      let erroBruto = err.message || String(err);
      if (err.name === 'AbortError') erroBruto = 'Tempo esgotado (timeout).';
      setError(`[DEBUG DA API]: ${erroBruto}`);
      setLoading(false);
    }
  };

  const handleBackToStep2 = () => {
    // Clear questions to generate fresh ones next time
    setGeneratedQuestions([]);
    setStep(2);
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    handleBackToStep2();
  };

  const handleSelectOption = (key: string) => {
    if (results[currentIdx] !== null) return; // Already answered
    
    const newSelected = [...selectedOptions];
    newSelected[currentIdx] = key;
    setSelectedOptions(newSelected);
  };

  const handleConfirmAnswer = () => {
    const q = generatedQuestions[currentIdx];
    const userSelected = selectedOptions[currentIdx];
    if (!userSelected) return;

    const isCorrect = userSelected === q.answer;
    
    const newResults = [...results];
    newResults[currentIdx] = isCorrect;
    setResults(newResults);
  };

  ;

  if (loading) {
    return (
      <div className={styles.wizardStep}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className={styles.spinner} style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '20px', fontWeight: 600, fontSize: '1.1rem', color: "var(--elite-cream)" }}>Gerando suas questões personalizadas...</p>
          <p style={{ color: 'var(--elite-grayblue)' }}>Isso leva apenas alguns segundos</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wizardStep}>
        <div style={{ padding: "var(--space-8)", background: "rgba(251, 235, 208, 0.03)", border: "1px solid rgba(196, 18, 48, 0.3)", borderRadius: "2px", textAlign: "center", boxShadow: "4px 4px 0 rgba(107, 0, 0, 0.25)" }}>
          <div style={{ marginBottom: "var(--space-3)", color: "var(--elite-red)", display: "flex", justifyContent: "center" }}>
            <AlertTriangle width={48} height={48} />
          </div>
          <h3 style={{ marginBottom: "var(--space-2)", color: "var(--elite-cream)" }}>Ops! Geração Interrompida</h3>
          <pre style={{ color: "#ff4d4d", fontSize: "0.95rem", marginBottom: "24px", padding: "16px", background: "#1a1a1a", borderRadius: "8px", border: "1px solid #ff4d4d", textAlign: "left", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{error}</pre>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary" 
              style={{ borderRadius: "2px", border: "1px solid rgba(107, 153, 179, 0.25)", background: "transparent", color: "var(--elite-grayblue)" }} 
              onClick={handleBackToStep2}
            >
              Voltar aos Filtros
            </button>
            <button 
              className={styles.qfResolverBtn} 
              style={{ padding: "12px 24px", fontSize: "0.95rem" }} 
              onClick={generateQuestions}
            >
              <RefreshCw width={16} height={16} /> Tentar novamente
            </button>
            
          </div>
        </div>
      </div>
    );
  }

  if (!generatedQuestions || generatedQuestions.length === 0) {
    return null;
  }

  const question = generatedQuestions[currentIdx];
  const isAnswered = results[currentIdx] !== null;
  const isCorrect = results[currentIdx];

  return (
    <>
      <div className={styles.quizFullscreenOverlay}>
        <header className={styles.qfHeader}>
          <div className={styles.qfHeaderLeft}>
            <button className={styles.qfExitBtn} onClick={() => setShowExitModal(true)}>
              <X width={20} height={20} />
            </button>
            <span className={styles.qfSubjectLabel}>
              {mode === 'concurso' ? filters.materia || 'Quiz' : 'Quiz'}
            </span>
          </div>
        </header>

        <div className={styles.qfBody}>
          <div className={styles.qfQuestionWrap}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                Questão {currentIdx + 1} de {generatedQuestions.length}
              </div>
            </div>

            <div style={{ marginBottom: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {question.fonte && <span className={styles.cafActiveBadge}>Fonte: {question.fonte}</span>}
              <span className={styles.cafActiveBadge}>Dificuldade: {question.difficulty || filters.dificuldade}</span>
            </div>
            
            <p className={styles.qfQuestionText} style={{ whiteSpace: "pre-wrap" }}>
              {question.text}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
              {question.options?.map((opt: any) => {
                const isSelected = selectedOptions[currentIdx] === opt.key;
                return (
                  <QuizOption 
                    key={`${currentIdx}-${opt.key}`}
                    opt={opt}
                    isSelected={isSelected}
                    isAnswered={isAnswered}
                    isCorrect={isCorrect}
                    questionAnswer={question.answer}
                    onSelect={handleSelectOption}
                  />
                );
              })}
            </div>

            {isAnswered && question.feedback && (
              <div style={{ padding: "20px", background: "var(--color-surface-offset)", borderRadius: "8px", borderLeft: "4px solid var(--color-primary)", marginBottom: "32px", animation: "fadeIn 0.3s ease" }}>
                <h4 style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Brain width={18} height={18} /> Explicação
                </h4>
                <p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--color-text)" }}>
                  {question.feedback}
                </p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "20px", borderTop: "1px solid var(--color-border)" }}>
              {!isAnswered ? (
                <button 
                  className={styles.qfResolverBtn}
                  disabled={!selectedOptions[currentIdx]}
                  onClick={handleConfirmAnswer}
                >
                  Responder
                </button>
              ) : (
                <button 
                  className={styles.qfResolverBtn}
                  onClick={() => {
                    if (currentIdx < generatedQuestions.length - 1) {
                      setCurrentIdx(currentIdx + 1);
                    } else {
                      alert("Quiz finalizado! (Integração de resultados na próxima etapa)");
                    }
                  }}
                >
                  {currentIdx < generatedQuestions.length - 1 ? "Próxima Questão" : "Ver Resultados"} <ChevronRight width={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar for Mobile */}
        <div className={styles.qfBottomBar}>
          <button 
            className={styles.qfBbBtn} 
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          >
            <ChevronLeft width={16} height={16} /> Anterior
          </button>
          <div className={styles.qfBbStatus}>Questão {currentIdx + 1} de {generatedQuestions.length}</div>
          <button 
            className={styles.qfBbBtn}
            disabled={currentIdx === generatedQuestions.length - 1}
            onClick={() => setCurrentIdx(Math.min(generatedQuestions.length - 1, currentIdx + 1))}
          >
            Próximo <ChevronRight width={16} height={16} />
          </button>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className={styles.qfExitModalOverlay}>
          <div className={styles.qfExitModal}>
            <div className={styles.qfExitModalTitle}>Sair do Modo Foco?</div>
            <div className={styles.qfExitModalSub}>Seu progresso nesta sessão será perdido. Deseja sair e iniciar um novo quiz?</div>
            <div className={styles.qfExitModalActions}>
              <button className={styles.qfExitContinueBtn} onClick={() => setShowExitModal(false)}>
                <BookOpen width={18} height={18} />
                Continuar estudando
              </button>
              <button className={styles.qfExitLeaveBtn} onClick={handleConfirmExit}>
                <RotateCcw width={15} height={15} />
                Sair e começar novo quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function QuizOption({ opt, isSelected, isAnswered, isCorrect, questionAnswer, onSelect }: any) {
  const [eliminated, setEliminated] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnswered) return;
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isAnswered || startX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // limit drag visual offset
    if (Math.abs(diff) < 100) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (isAnswered || startX.current === null) return;
    if (Math.abs(dragOffset) > 50) {
      setEliminated(!eliminated);
    }
    setDragOffset(0);
    startX.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAnswered) return;
    setEliminated(!eliminated);
  };

  let optionStyle: React.CSSProperties = {
    padding: "16px",
    borderRadius: "8px",
    border: `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
    background: isSelected ? "oklch(from var(--color-primary) l c h / 0.05)" : "var(--color-surface-offset)",
    cursor: isAnswered ? "default" : "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "all 0.3s ease",
    transform: `translateX(${dragOffset}px)`,
    opacity: eliminated ? 0.5 : 1,
  };

  if (isAnswered) {
    if (opt.key === questionAnswer) {
      optionStyle.border = "2px solid var(--color-success)";
      optionStyle.background = "oklch(from var(--color-success) l c h / 0.1)";
    } else if (isSelected && !isCorrect) {
      optionStyle.border = "2px solid var(--color-error)";
      optionStyle.background = "oklch(from var(--color-error) l c h / 0.1)";
    }
  }

  return (
    <div 
      style={optionStyle}
      onClick={() => {
        if (!eliminated) onSelect(opt.key);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={handleContextMenu}
    >
      <div style={{ 
        width: "36px", height: "36px", borderRadius: "50%", 
        background: isSelected ? "var(--color-primary)" : "var(--color-bg)",
        border: "1px solid var(--color-border)",
        color: isSelected ? "white" : "var(--color-text)",
        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0,
        transition: "all 0.3s ease"
      }}>
        {opt.key.toUpperCase()}
      </div>
      <div style={{ flex: 1, lineHeight: 1.5, fontSize: "1rem", textDecoration: eliminated ? 'line-through' : 'none', transition: 'all 0.3s ease' }}>
        {opt.text}
      </div>
      {isAnswered && opt.key === questionAnswer && <CheckCircle color="var(--color-success)" width={20} />}
      {isAnswered && isSelected && !isCorrect && <XCircle color="var(--color-error)" width={20} />}
    </div>
  );
}
