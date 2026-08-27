"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuizStore } from "@/store/useQuizStore";
import {
  AlertTriangle, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Brain, RotateCcw, BookOpen,
  Filter, BarChart2, Edit3, Flag,
} from "lucide-react";
import styles from "./Wizard.module.css";

const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL ||
  "https://aivur-worker.cesarmuniz0816.workers.dev";

export default function WizardStep3() {
  const mode = useQuizStore((s) => s.mode);
  const filters = useQuizStore((s) => s.filters);
  const freeStudy = useQuizStore((s) => s.freeStudy);
  const setStep = useQuizStore((s) => s.setStep);
  const generatedQuestions = useQuizStore((s) => s.generatedQuestions);
  const setGeneratedQuestions = useQuizStore((s) => s.setGeneratedQuestions);

  const [loading, setLoading] = useState(!generatedQuestions.length);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<(string | null)[]>([]);
  const [results, setResults] = useState<(boolean | null)[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Garante que o Portal so monta no client
  useEffect(() => { setMounted(true); }, []);

  /* History back-button interception */
  useEffect(() => {
    if (!loading && !error && generatedQuestions.length > 0) {
      window.history.pushState({ quizActive: true }, "");
      const onPop = (e: PopStateEvent) => {
        e.preventDefault();
        setShowExitModal(true);
        window.history.pushState({ quizActive: true }, "");
      };
      window.addEventListener("popstate", onPop);
      return () => window.removeEventListener("popstate", onPop);
    }
  }, [loading, error, generatedQuestions]);

  /* Boot */
  useEffect(() => {
    if (generatedQuestions.length === 0 && !error) {
      fetchQuestions();
    } else if (selectedOptions.length === 0) {
      setSelectedOptions(new Array(generatedQuestions.length).fill(null));
      setResults(new Array(generatedQuestions.length).fill(null));
    }
    return () => abortRef.current?.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* API call */
  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    abortRef.current = new AbortController();

    let filterKey: string | null = null;
    if (mode === "concurso" && filters.materia && filters.materia !== "Todas") {
      filterKey = `concursos.${filters.materia}`;
    }

    const payload = {
      mode,
      filter: filterKey,
      topic: filters.assunto !== "Todos" ? filters.assunto : null,
      banca: filters.banca !== "Todas" ? filters.banca : null,
      concurso: filters.orgao !== "Todos" ? filters.orgao : null,
      cargo: filters.cargo !== "Todos" ? filters.cargo : null,
      ano: filters.ano !== "Todos" ? filters.ano : null,
      nivel: filters.nivel !== "Todos" ? filters.nivel : null,
      freeText: freeStudy.text,
      editalText: useQuizStore.getState().editalText,
      difficulty: filters.dificuldade,
      quantity: filters.quantidade,
      questionType: filters.tipoQuestao,
      idioma: "pt-BR",
      sessionMode: "normal",
    };

    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      });

      let rawText = "";
      try { rawText = await res.text(); } catch { throw new Error("Falha ao ler resposta da rede."); }

      let data: any;
      try { data = JSON.parse(rawText); } catch { throw new Error(`[JSON_PARSE_ERROR]: ${rawText.substring(0, 150)}`); }

      if (!res.ok) throw new Error(data?.error || data?.userMessage || `Erro HTTP ${res.status}`);
      if (data?.success === false) throw new Error(data?.error || data?.userMessage || "Falha ao processar requisicao.");
      if (!Array.isArray(data?.questions) || data.questions.length === 0)
        throw new Error(data?.userMessage || "O formato da resposta nao e valido ou nenhuma questao foi retornada.");

      setGeneratedQuestions(data.questions);
      setSelectedOptions(new Array(data.questions.length).fill(null));
      setResults(new Array(data.questions.length).fill(null));
      setCurrentIdx(0);
      setLoading(false);
    } catch (err: any) {
      setError(
        err.name === "AbortError"
          ? "Tempo esgotado. O servidor demorou muito para responder."
          : "Ocorreu uma instabilidade na conexao com a IA. Tente novamente."
      );
      setLoading(false);
    }
  };

  /* Helpers */
  const handleBackToStep2 = () => { setGeneratedQuestions([]); setStep(2); };
  const handleSelectOption = (idx: number, key: string) => {
    if (results[idx] !== null) return;
    const next = [...selectedOptions];
    next[idx] = key;
    setSelectedOptions(next);
  };
  const handleConfirmAnswer = (idx: number) => {
    const selected = selectedOptions[idx];
    if (!selected) return;
    const next = [...results];
    next[idx] = selected === generatedQuestions[idx].answer;
    setResults(next);
  };

  /* Loading */
  if (loading) {
    return (
      <div className={styles.wizardStep}>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div className={styles.spinner} style={{ margin: "0 auto" }} />
          <p style={{ marginTop: "20px", fontWeight: 600, fontSize: "1.1rem", color: "var(--elite-cream)" }}>
            Gerando suas questoes personalizadas...
          </p>
          <p style={{ color: "var(--elite-grayblue)" }}>Isso leva apenas alguns segundos</p>
        </div>
      </div>
    );
  }

  /* Error */
  if (error) {
    return (
      <div className={styles.wizardStep}>
        <div style={{ padding: "var(--space-8)", background: "rgba(251,235,208,0.03)", border: "1px solid rgba(196,18,48,0.3)", borderRadius: "2px", textAlign: "center", boxShadow: "4px 4px 0 rgba(107,0,0,0.25)" }}>
          <div style={{ marginBottom: "var(--space-3)", color: "var(--elite-red)", display: "flex", justifyContent: "center" }}>
            <AlertTriangle width={48} height={48} />
          </div>
          <h3 style={{ marginBottom: "var(--space-2)", color: "var(--elite-cream)" }}>Ops! Geracao Interrompida</h3>
          <p style={{ color: "var(--elite-grayblue)", fontSize: "1.05rem", marginBottom: "24px" }}>{error}</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" style={{ borderRadius: "2px", border: "1px solid rgba(107,153,179,0.25)", background: "transparent", color: "var(--elite-grayblue)" }} onClick={handleBackToStep2}>
              Voltar aos Filtros
            </button>
            <button className={styles.qfResolverBtn} style={{ padding: "12px 24px", fontSize: "0.95rem" }} onClick={fetchQuestions}>
              <RefreshCw width={16} height={16} /> Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!generatedQuestions || generatedQuestions.length === 0) return null;

  /* RENDER PRINCIPAL via Portal - escapa do DOM pai que quebra o fixed */
  const playerUI = (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, backgroundColor: "#f3f4f6", overflowY: "auto" }}>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-[100] w-full bg-[#f68b33] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <button onClick={() => setShowExitModal(true)} className="p-1 rounded hover:bg-[#e07722] transition-colors">
          <ChevronLeft size={24} />
        </button>
        <span className="font-semibold text-base truncate max-w-[180px]">
          {mode === "concurso" ? filters.materia || "Questoes" : "Questoes"}
        </span>
        <button onClick={handleBackToStep2} className="p-1 rounded hover:bg-[#e07722] transition-colors">
          <Filter size={20} />
        </button>
      </div>

      {/* Desktop top bar */}
      <div className="hidden md:flex sticky top-0 z-[100] w-full bg-white border-b border-gray-200 items-center justify-between px-8 py-3 shadow-sm">
        <span className="font-semibold text-gray-700">
          {mode === "concurso" ? filters.materia || "Questoes" : "Questoes"}
        </span>
        <button onClick={handleBackToStep2} className="flex items-center gap-2 text-sm text-[#f68b33] hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors font-medium">
          <Filter size={16} /> Alterar Filtros
        </button>
      </div>

      {/* Container mestre */}
      <div style={{ width: "100%", maxWidth: "56rem", margin: "0 auto", padding: "1.5rem 1rem 8rem" }}>
        {generatedQuestions.map((question: any, idx: number) => {
          const showMobile = idx === currentIdx;
          const isAnswered = results[idx] !== null;
          const isCorrect = results[idx] as boolean | null;
          const selectedOption = selectedOptions[idx];
          return (
            <QuestionCard
              key={idx}
              question={question}
              idx={idx}
              filters={filters}
              showMobile={showMobile}
              isAnswered={isAnswered}
              isCorrect={isCorrect}
              selectedOption={selectedOption}
              onSelect={(key: string) => handleSelectOption(idx, key)}
              onAnswer={() => handleConfirmAnswer(idx)}
            />
          );
        })}
      </div>

      {/* Mobile bottom bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, width: "100%", backgroundColor: "white", borderTop: "1px solid #e5e7eb", padding: "1rem 1.5rem", zIndex: 99999, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -10px 15px -3px rgba(0,0,0,0.1)" }} className="md:hidden">
        <button
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          className="flex items-center gap-1.5 font-semibold text-gray-600 hover:text-[#f68b33] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={20} /> Anterior
        </button>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", padding: "0.375rem 1rem", borderRadius: "9999px" }}>
          {currentIdx + 1} / {generatedQuestions.length}
        </div>
        <button
          disabled={currentIdx === generatedQuestions.length - 1}
          onClick={() => setCurrentIdx(Math.min(generatedQuestions.length - 1, currentIdx + 1))}
          className="flex items-center gap-1.5 font-semibold text-gray-600 hover:text-[#f68b33] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Proximo <ChevronRight size={20} />
        </button>
      </div>

      {/* Exit modal */}
      {showExitModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)", padding: "1rem" }}>
          <div style={{ backgroundColor: "white", borderRadius: "1rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", maxWidth: "24rem", width: "100%", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>Sair do Modo Foco?</h3>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem", fontSize: "0.875rem", lineHeight: "1.625" }}>
              Seu progresso nesta sessao sera perdido. Deseja sair?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button onClick={() => setShowExitModal(false)} style={{ width: "100%", padding: "0.75rem 1rem", backgroundColor: "#f68b33", color: "white", fontWeight: 700, borderRadius: "0.75rem", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <BookOpen size={18} /> Continuar estudando
              </button>
              <button onClick={() => { setShowExitModal(false); handleBackToStep2(); }} style={{ width: "100%", padding: "0.75rem 1rem", backgroundColor: "white", color: "#374151", fontWeight: 700, borderRadius: "0.75rem", border: "1px solid #d1d5db", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <RotateCcw size={18} /> Sair e comecar novo quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Renderiza via Portal no body para escapar de qualquer transform/overflow pai
  if (!mounted) return null;
  return createPortal(playerUI, document.body);
}

/* QuestionCard */
function QuestionCard({ question, idx, filters, showMobile, isAnswered, isCorrect, selectedOption, onSelect, onAnswer }: any) {
  const [showExplanation, setShowExplanation] = useState(false);
  useEffect(() => { if (isAnswered) setShowExplanation(true); }, [isAnswered]);

  const cardStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "1rem",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)",
    padding: "1.5rem",
    marginBottom: "2rem",
    display: showMobile ? "flex" : "none",
    flexDirection: "column",
    gap: "1rem",
  };

  return (
    <div style={cardStyle} className="md:!flex">

      {/* Metadados */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
        <span style={{ color: "#f68b33", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Q{idx + 1}</span>
        <span style={{ width: "1px", height: "12px", backgroundColor: "#d1d5db" }} />
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Inedita (IA)</span>
        {filters.banca && filters.banca !== "Todas" && (
          <><span style={{ width: "1px", height: "12px", backgroundColor: "#d1d5db" }} /><span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{filters.banca}</span></>
        )}
        {filters.materia && (
          <><span style={{ width: "1px", height: "12px", backgroundColor: "#d1d5db" }} /><span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{filters.materia}</span></>
        )}
      </div>

      {/* Enunciado */}
      <h3 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#111827", lineHeight: "1.75", whiteSpace: "pre-wrap", margin: 0 }}>
        {question.text}
      </h3>

      {/* Alternativas */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
        {question.options?.map((opt: any) => (
          <OptionButton
            key={opt.key}
            opt={opt}
            isSelected={selectedOption === opt.key}
            isAnswered={isAnswered}
            isCorrect={isCorrect}
            correctAnswer={question.answer}
            onSelect={() => onSelect(opt.key)}
          />
        ))}
      </div>

      {/* Botao Responder */}
      {!isAnswered && (
        <div style={{ paddingTop: "0.5rem" }}>
          <button
            disabled={!selectedOption}
            onClick={onAnswer}
            style={{
              width: "100%",
              padding: "0.875rem 2.5rem",
              backgroundColor: selectedOption ? "#f68b33" : "#e5e7eb",
              color: selectedOption ? "white" : "#9ca3af",
              fontWeight: 700,
              borderRadius: "0.75rem",
              border: "none",
              cursor: selectedOption ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              fontSize: "1rem",
            }}
          >
            Responder
          </button>
        </div>
      )}

      {/* Action bar */}
      {isAnswered && (
        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "1rem", marginTop: "0.5rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            <button
              onClick={() => setShowExplanation((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "none",
                backgroundColor: showExplanation ? "#fff7ed" : "transparent",
                color: showExplanation ? "#f68b33" : "#4b5563",
                fontWeight: 500, cursor: "pointer", fontSize: "0.875rem",
              }}
            >
              <BookOpen size={15} /> Gabarito Comentado
            </button>
            <button onClick={() => alert("Estatisticas: Em breve")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "none", backgroundColor: "transparent", color: "#4b5563", fontWeight: 500, cursor: "pointer", fontSize: "0.875rem" }}>
              <BarChart2 size={15} /> Estatisticas
            </button>
            <button onClick={() => alert("Criar Anotacoes: Em breve")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "none", backgroundColor: "transparent", color: "#4b5563", fontWeight: 500, cursor: "pointer", fontSize: "0.875rem" }}>
              <Edit3 size={15} /> Criar Anotacoes
            </button>
            <button onClick={() => alert("Notificar Erro: Em breve")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "none", backgroundColor: "transparent", color: "#4b5563", fontWeight: 500, cursor: "pointer", fontSize: "0.875rem" }}>
              <Flag size={15} /> Notificar Erro
            </button>
          </div>

          {/* Explicacao expandivel */}
          <div style={{ overflow: "hidden", maxHeight: showExplanation ? "3000px" : "0px", opacity: showExplanation ? 1 : 0, transition: "max-height 0.3s ease, opacity 0.3s ease", marginTop: showExplanation ? "0.5rem" : "0" }}>
            <div style={{ position: "relative", padding: "1.25rem", backgroundColor: "#f9fafb", borderRadius: "0.75rem", border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "6px", height: "100%", backgroundColor: "#f68b33" }} />
              <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, color: "#1f2937", fontSize: "0.875rem", marginBottom: "0.75rem", paddingLeft: "0.5rem" }}>
                <Brain size={16} style={{ color: "#f68b33" }} /> Resolucao da IA
              </h4>
              <div style={{ color: "#374151", fontSize: "0.875rem", lineHeight: "1.625", whiteSpace: "pre-wrap", paddingLeft: "0.5rem" }}>
                {question.feedback}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* OptionButton */
function OptionButton({ opt, isSelected, isAnswered, isCorrect, correctAnswer, onSelect }: any) {
  const isRight = opt.key === correctAnswer;
  const isWrong = isSelected && !isCorrect;

  let bgColor = "white";
  let borderColor = "#d1d5db";
  let circleColor = "white";
  let circleBorder = "#d1d5db";
  let circleText = "#6b7280";
  let opacity = 1;

  if (!isAnswered) {
    if (isSelected) {
      borderColor = "#f68b33";
      bgColor = "#fff7ed";
      circleColor = "#f68b33";
      circleBorder = "#f68b33";
      circleText = "white";
    }
  } else {
    if (isRight) {
      bgColor = "#f0fdf4";
      borderColor = "#4ade80";
      circleColor = "#22c55e";
      circleBorder = "#22c55e";
      circleText = "white";
    } else if (isWrong) {
      bgColor = "#fef2f2";
      borderColor = "#f87171";
      circleColor = "#ef4444";
      circleBorder = "#ef4444";
      circleText = "white";
    } else {
      opacity = 0.4;
    }
  }

  return (
    <button
      onClick={() => !isAnswered && onSelect()}
      disabled={isAnswered}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "1rem",
        borderRadius: "0.75rem",
        border: `2px solid ${borderColor}`,
        backgroundColor: bgColor,
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
        cursor: isAnswered ? "default" : "pointer",
        transition: "all 0.2s",
        opacity,
      }}
    >
      <span style={{
        flexShrink: 0,
        width: "2rem", height: "2rem",
        borderRadius: "50%",
        border: `2px solid ${circleBorder}`,
        backgroundColor: circleColor,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: "0.875rem",
        color: circleText,
        marginTop: "2px",
      }}>
        {opt.key.toUpperCase()}
      </span>
      <span style={{
        flex: 1, fontSize: "1rem", lineHeight: "1.5",
        color: isAnswered && (isRight || isWrong) ? "#111827" : "#374151",
        fontWeight: isAnswered && (isRight || isWrong) ? 600 : 400,
      }}>
        {opt.text}
      </span>
      {isAnswered && isRight && <CheckCircle size={22} style={{ color: "#22c55e", flexShrink: 0, marginTop: "2px" }} />}
      {isAnswered && isWrong && <XCircle size={22} style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }} />}
    </button>
  );
}