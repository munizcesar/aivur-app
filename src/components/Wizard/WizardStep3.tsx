"use client";

import React, { useEffect, useState, useRef } from "react";
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

  const abortRef = useRef<AbortController | null>(null);

  /* â”€â”€ History back-button interception â”€â”€ */
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

  /* â”€â”€ Boot â”€â”€ */
  useEffect(() => {
    if (generatedQuestions.length === 0 && !error) {
      fetchQuestions();
    } else if (selectedOptions.length === 0) {
      setSelectedOptions(new Array(generatedQuestions.length).fill(null));
      setResults(new Array(generatedQuestions.length).fill(null));
    }
    return () => abortRef.current?.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* â”€â”€ API call â”€â”€ */
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
      if (data?.success === false) throw new Error(data?.error || data?.userMessage || "Falha ao processar requisiÃ§Ã£o.");
      if (!Array.isArray(data?.questions) || data.questions.length === 0)
        throw new Error(data?.userMessage || "O formato da resposta nÃ£o Ã© vÃ¡lido ou nenhuma questÃ£o foi retornada.");

      setGeneratedQuestions(data.questions);
      setSelectedOptions(new Array(data.questions.length).fill(null));
      setResults(new Array(data.questions.length).fill(null));
      setCurrentIdx(0);
      setLoading(false);
    } catch (err: any) {
      setError(
        err.name === "AbortError"
          ? "Tempo esgotado. O servidor demorou muito para responder."
          : "Ocorreu uma instabilidade na conexÃ£o com a IA. Tente novamente."
      );
      setLoading(false);
    }
  };

  /* â”€â”€ Helpers â”€â”€ */
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

  /* â”€â”€ Loading â”€â”€ */
  if (loading) {
    return (
      <div className={styles.wizardStep}>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div className={styles.spinner} style={{ margin: "0 auto" }} />
          <p style={{ marginTop: "20px", fontWeight: 600, fontSize: "1.1rem", color: "var(--elite-cream)" }}>
            Gerando suas questÃµes personalizadas...
          </p>
          <p style={{ color: "var(--elite-grayblue)" }}>Isso leva apenas alguns segundos</p>
        </div>
      </div>
    );
  }

  /* â”€â”€ Error â”€â”€ */
  if (error) {
    return (
      <div className={styles.wizardStep}>
        <div style={{ padding: "var(--space-8)", background: "rgba(251,235,208,0.03)", border: "1px solid rgba(196,18,48,0.3)", borderRadius: "2px", textAlign: "center", boxShadow: "4px 4px 0 rgba(107,0,0,0.25)" }}>
          <div style={{ marginBottom: "var(--space-3)", color: "var(--elite-red)", display: "flex", justifyContent: "center" }}>
            <AlertTriangle width={48} height={48} />
          </div>
          <h3 style={{ marginBottom: "var(--space-2)", color: "var(--elite-cream)" }}>Ops! GeraÃ§Ã£o Interrompida</h3>
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

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     RENDER PRINCIPAL
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  return (
    /* Tela cheia com scroll vertical â€“ sem flex que encolhe filhos */
    <div className="fixed inset-0 z-[100] bg-gray-100 overflow-y-auto">

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 w-full bg-[#f68b33] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <button onClick={() => setShowExitModal(true)} className="p-1 rounded hover:bg-[#e07722] transition-colors">
          <ChevronLeft size={24} />
        </button>
        <span className="font-semibold text-base truncate max-w-[180px]">
          {mode === "concurso" ? filters.materia || "QuestÃµes" : "QuestÃµes"}
        </span>
        <button onClick={handleBackToStep2} className="p-1 rounded hover:bg-[#e07722] transition-colors" title="Alterar Filtros">
          <Filter size={20} />
        </button>
      </div>

      {/* Desktop top bar */}
      <div className="hidden md:flex sticky top-0 z-40 w-full bg-white border-b border-gray-200 items-center justify-between px-8 py-3 shadow-sm">
        <span className="font-semibold text-gray-700">
          {mode === "concurso" ? filters.materia || "QuestÃµes" : "QuestÃµes"}
        </span>
        <button onClick={handleBackToStep2} className="flex items-center gap-2 text-sm text-[#f68b33] hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors font-medium">
          <Filter size={16} /> Alterar Filtros
        </button>
      </div>

      {/* Container mestre das questÃµes */}
      <div className="relative w-full max-w-4xl mx-auto px-4 pb-32 pt-6">
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

      {/* Mobile bottom bar â€“ fixada na raiz da tela, fora do scroll */}
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 z-[9999] flex justify-between items-center shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] md:hidden">
        <button
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          className="flex items-center gap-1.5 font-semibold text-gray-600 hover:text-[#f68b33] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={20} /> Anterior
        </button>
        <div className="text-sm font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
          {currentIdx + 1} / {generatedQuestions.length}
        </div>
        <button
          disabled={currentIdx === generatedQuestions.length - 1}
          onClick={() => setCurrentIdx(Math.min(generatedQuestions.length - 1, currentIdx + 1))}
          className="flex items-center gap-1.5 font-semibold text-gray-600 hover:text-[#f68b33] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          PrÃ³ximo <ChevronRight size={20} />
        </button>
      </div>

      {/* Exit modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sair do Modo Foco?</h3>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              Seu progresso nesta sessÃ£o serÃ¡ perdido. Deseja sair e iniciar um novo quiz?
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setShowExitModal(false)} className="w-full py-3 px-4 bg-[#f68b33] hover:bg-[#e07722] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                <BookOpen size={18} /> Continuar estudando
              </button>
              <button onClick={() => { setShowExitModal(false); handleBackToStep2(); }} className="w-full py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                <RotateCcw size={18} /> Sair e comeÃ§ar novo quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   QuestionCard
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function QuestionCard({ question, idx, filters, showMobile, isAnswered, isCorrect, selectedOption, onSelect, onAnswer }: any) {
  const [showExplanation, setShowExplanation] = useState(false);
  useEffect(() => { if (isAnswered) setShowExplanation(true); }, [isAnswered]);

  return (
    <div className={[
      "bg-white dark:bg-gray-800",
      "rounded-2xl border border-gray-200 dark:border-gray-700",
      "shadow-sm p-6 mb-8",
      "flex flex-col gap-4 relative z-10",
      showMobile ? "flex" : "hidden md:flex",
    ].join(" ")}>

      {/* Metadados */}
      <div className="flex flex-wrap gap-2 items-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        <span className="text-[#f68b33]">Q{idx + 1}</span>
        <span className="w-px h-3 bg-gray-300" />
        <span>InÃ©dita (IA)</span>
        {filters.banca && filters.banca !== "Todas" && (<><span className="w-px h-3 bg-gray-300" /><span>{filters.banca}</span></>)}
        {filters.materia && (<><span className="w-px h-3 bg-gray-300" /><span>{filters.materia}</span></>)}
      </div>

      {/* Enunciado */}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
        {question.text}
      </h3>

      {/* Alternativas */}
      <div className="flex flex-col gap-3 mt-4">
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

      {/* BotÃ£o Responder */}
      {!isAnswered && (
        <div className="pt-2">
          <button
            disabled={!selectedOption}
            onClick={onAnswer}
            className="w-full md:w-auto px-10 py-3.5 bg-[#f68b33] hover:bg-[#e07722] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            Responder
          </button>
        </div>
      )}

      {/* Action bar */}
      {isAnswered && (
        <div className="border-t border-gray-100 pt-4 mt-2">
          <div className="flex flex-wrap gap-2 text-sm font-medium text-gray-500">
            <button
              onClick={() => setShowExplanation((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${showExplanation ? "text-[#f68b33] bg-orange-50" : "hover:bg-gray-100 text-gray-600"}`}
            >
              <BookOpen size={15} /> Gabarito Comentado
            </button>
            <button onClick={() => alert("EstatÃ­sticas: Em breve")} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <BarChart2 size={15} /> EstatÃ­sticas
            </button>
            <button onClick={() => alert("Criar AnotaÃ§Ãµes: Em breve")} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Edit3 size={15} /> Criar AnotaÃ§Ãµes
            </button>
            <button onClick={() => alert("Notificar Erro: Em breve")} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Flag size={15} /> Notificar Erro
            </button>
          </div>

          {/* Gabarito comentado â€“ expansÃ£o suave */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showExplanation ? "max-h-[3000px] opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
            <div className="relative p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#f68b33] rounded-l-xl" />
              <h4 className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-200 text-sm mb-3 pl-2">
                <Brain size={16} className="text-[#f68b33]" /> ResoluÃ§Ã£o da IA
              </h4>
              <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap pl-2">
                {question.feedback}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   OptionButton
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function OptionButton({ opt, isSelected, isAnswered, isCorrect, correctAnswer, onSelect }: any) {
  const isRight = opt.key === correctAnswer;
  const isWrong = isSelected && !isCorrect;

  let container = "w-full text-left p-4 rounded-xl border flex items-start gap-4 transition-all duration-200 ";
  if (!isAnswered) {
    container += isSelected
      ? "border-[#f68b33] bg-orange-50 cursor-pointer"
      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer";
  } else {
    if (isRight) container += "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20 cursor-default";
    else if (isWrong) container += "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/20 cursor-default";
    else container += "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-45 cursor-default";
  }

  let circle = "flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm mt-0.5 transition-all duration-200 ";
  if (!isAnswered) {
    circle += isSelected ? "bg-[#f68b33] border-[#f68b33] text-white" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500";
  } else {
    if (isRight) circle += "bg-green-500 border-green-500 text-white";
    else if (isWrong) circle += "bg-red-500 border-red-500 text-white";
    else circle += "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400";
  }

  return (
    <button className={container} onClick={() => !isAnswered && onSelect()} disabled={isAnswered}>
      <span className={circle}>{opt.key.toUpperCase()}</span>
      <span className={`flex-1 text-base leading-snug ${isAnswered && (isRight || isWrong) ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"}`}>
        {opt.text}
      </span>
      {isAnswered && isRight && <CheckCircle size={22} className="flex-shrink-0 text-green-500 mt-0.5" />}
      {isAnswered && isWrong && <XCircle size={22} className="flex-shrink-0 text-red-500 mt-0.5" />}
    </button>
  );
}
