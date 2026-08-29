"use client";

import React, { useEffect, useState, useRef } from "react";
import { useQuizStore } from "@/store/useQuizStore";
import {
  AlertTriangle, RefreshCw, ChevronLeft, ChevronRight,
  BookOpen, Filter, RotateCcw
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

  useEffect(() => {
    if (generatedQuestions.length === 0 && !error) {
      fetchQuestions();
    } else if (selectedOptions.length === 0) {
      setSelectedOptions(new Array(generatedQuestions.length).fill(null));
      setResults(new Array(generatedQuestions.length).fill(null));
    }
    return () => abortRef.current?.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleBackToStep2 = () => { setGeneratedQuestions([]); setStep(2); };
  
  const handleOptionSelect = (id: number, key: string) => {
    if (results[id] !== null) return;
    const next = [...selectedOptions];
    next[id] = key;
    setSelectedOptions(next);
  };
  
  const handleAnswerSubmit = (id: number) => {
    const selected = selectedOptions[id];
    if (!selected) return;
    const next = [...results];
    
    const rawQ = generatedQuestions[id];
    const answer = rawQ.answer || rawQ.resposta || rawQ.correctAnswer || rawQ.gabarito || "";
    
    next[id] = String(selected).toLowerCase() === String(answer).toLowerCase();
    setResults(next);
  };

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

  if (!generatedQuestions || generatedQuestions.length === 0) {
    return <h2 className="text-white text-2xl text-center p-10">ERRO: Nenhuma questao chegou neste componente.</h2>;
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto pb-32 pt-6 px-4">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-[100] w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 flex items-center justify-between px-4 py-3 shadow-sm">
        <button onClick={() => setShowExitModal(true)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <span className="font-semibold text-base truncate max-w-[180px]">
          {mode === "concurso" ? filters.materia || "Questoes" : "Questoes"}
        </span>
        <button onClick={handleBackToStep2} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Filter size={20} />
        </button>
      </div>

      {/* Desktop top bar */}
      <div className="hidden md:flex sticky top-0 z-[100] w-full bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 items-center justify-between px-8 py-3 shadow-sm">
        <span className="font-semibold text-gray-700 dark:text-slate-200">
          {mode === "concurso" ? filters.materia || "Questoes" : "Questoes"}
        </span>
        <button onClick={handleBackToStep2} className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium">
          <Filter size={16} /> Alterar Filtros
        </button>
      </div>

      {/* Questions list */}
      {generatedQuestions.map((rawQ: any, index: number) => {
        const showMobile = index === currentIdx;
        const isAnswered = results[index] !== null;

        let qOptions: any[] = [];
        const ro = rawQ.options || rawQ.alternativas || rawQ.choices || [];
        if (Array.isArray(ro)) {
          if (ro.length > 0 && typeof ro[0] === "string") {
            const letters = ["A", "B", "C", "D", "E"];
            qOptions = ro.map((text: string, i: number) => ({ key: letters[i] || String(i), text }));
          } else {
            qOptions = ro.map((opt: any, i: number) => ({
              key: opt.key || opt.id || opt.letra || ["A", "B", "C", "D", "E"][i] || String(i),
              text: opt.text || opt.value || opt.texto || opt.descricao || "",
            }));
          }
        } else if (typeof ro === "object" && ro !== null) {
          qOptions = Object.entries(ro).map(([k, v]) => ({ key: k, text: String(v) }));
        }

        const question = {
          id: index,
          statement: rawQ.statement || rawQ.text || rawQ.title || rawQ.question || rawQ.enunciado || "Enunciado nao disponivel",
          correctAnswer: rawQ.answer || rawQ.resposta || rawQ.correctAnswer || rawQ.gabarito || "",
          explanation: rawQ.explanation || rawQ.feedback || rawQ.explicacao || rawQ.justificativa || "Nenhuma explicacao geral fornecida.",
          options: qOptions
        };

        const selectedAnswers: any = { [index]: selectedOptions[index] };

        return (
          <div key={question.id || index} style={{ display: showMobile ? undefined : 'none' }} className="md:!block">
            {/* INICIO DO BLOCO EXACTO DO USUARIO */}
            <div key={question.id || index} className="w-full bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 mb-6">
              
              {/* Cabeçalho */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                <span>Q{index + 1} • INÉDITA (IA) • {filters.materia || "Disciplina"}</span>
              </div>

              {/* Enunciado */}
              <p className="text-lg text-slate-900 dark:text-slate-100 font-medium leading-relaxed mb-8">
                {question.statement}
              </p>

              {/* Alternativas */}
              <div className="flex flex-col gap-4">
                {question.options.map((opt: any) => {
                  const isSelected = selectedAnswers[question.id] === opt.key;
                  const isCorrect = question.correctAnswer === opt.key;
                  
                  let btnClasses = "w-full text-left p-4 mb-3 rounded-lg border flex items-start gap-4 transition-colors ";
                  let circleClasses = "shrink-0 flex items-center justify-center w-8 h-8 rounded-full border text-sm font-bold ";
                  
                  if (!isAnswered) {
                    btnClasses += isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700";
                    circleClasses += isSelected ? "border-blue-500 text-blue-700 dark:text-blue-400" : "border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-300";
                  } else {
                    if (isCorrect) {
                      btnClasses += "border-green-500 bg-green-50 dark:bg-green-900/20";
                      circleClasses += "border-green-500 bg-green-500 text-white";
                    } else if (isSelected && !isCorrect) {
                      btnClasses += "border-red-500 bg-red-50 dark:bg-red-900/20";
                      circleClasses += "border-red-500 bg-red-500 text-white";
                    } else {
                      btnClasses += "border-slate-300 dark:border-slate-700 opacity-50";
                      circleClasses += "border-slate-300 dark:border-slate-600 text-slate-500";
                    }
                  }

                  return (
                    <button key={opt.key} onClick={() => handleOptionSelect(question.id, opt.key)} disabled={isAnswered} className={btnClasses}>
                      <span className={circleClasses}>{opt.key}</span>
                      <span className="mt-0.5 text-slate-700 dark:text-slate-200 text-base font-medium">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Botão Responder (Oculto após responder) */}
              {!isAnswered && (
                <div className="mt-8 flex justify-end">
                  <button onClick={() => handleAnswerSubmit(question.id)} disabled={!selectedAnswers[question.id]} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-xl transition-colors">
                    Responder
                  </button>
                </div>
              )}

              {/* Mentor AIVUR (Revelado após responder) */}
              {isAnswered && (
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-lg mb-4">
                    <span>🎓 Mentor AIVUR</span>
                  </div>
                  <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-slate-800 dark:text-slate-200 leading-relaxed">
                    {question.explanation}
                  </div>
                </div>
              )}
            </div>
            {/* FIM DO BLOCO EXACTO DO USUARIO */}
          </div>
        );
      })}

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-[99999] flex justify-between items-center shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] md:hidden">
        <button
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          className="flex items-center gap-1.5 font-semibold text-gray-600 hover:text-[#f68b33] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={20} /> Anterior
        </button>
        <div className="text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-4 py-1.5 rounded-full">
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
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sair do Modo Foco?</h3>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              Seu progresso nesta sessao sera perdido. Deseja sair?
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setShowExitModal(false)} className="w-full py-3 px-4 bg-[#f68b33] hover:bg-[#e07722] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                <BookOpen size={18} /> Continuar estudando
              </button>
              <button onClick={() => { setShowExitModal(false); handleBackToStep2(); }} className="w-full py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                <RotateCcw size={18} /> Sair e comecar novo quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
