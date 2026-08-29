"use client";

import React, { useEffect, useRef, useState } from "react";
import { useQuizStore } from "@/store/useQuizStore";
import {
  AlertTriangle,
  BarChart2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Edit3,
  Flag,
  GraduationCap,
  RefreshCw,
  RotateCcw,
  XCircle,
  Brain,
  Filter,
} from "lucide-react";
import styles from "./Wizard.module.css";

const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL ||
  "https://aivur-worker.cesarmuniz0816.workers.dev";

type QuestionOption = {
  key: string;
  text: string;
};

type NormalizedQuestion = {
  qText: string;
  qAnswer: string;
  qFeedback: string;
  qFonte: string | null;
  qOptionExplanations: Record<string, string>;
  qOptions: QuestionOption[];
};

function normalizeQuestion(question: any): NormalizedQuestion {
  const qText =
    question.statement ||
    question.text ||
    question.title ||
    question.question ||
    question.enunciado ||
    "Enunciado nao disponivel";

  const qAnswer =
    question.answer ||
    question.resposta ||
    question.resposta_correta ||
    question.correctAnswer ||
    question.correct_option ||
    question.gabarito ||
    "";

  const qFeedback =
    question.explanation ||
    question.feedback ||
    question.explicacao ||
    question.justificativa ||
    question.comentario ||
    "Nenhuma explicacao geral fornecida.";

  const qFonte = question.fonte || question.source || null;
  const qOptionExplanations = (question.optionExplanations || {}) as Record<string, string>;

  let qOptions: QuestionOption[] = [];
  const rawOptions = question.options || question.alternativas || question.choices || [];

  if (Array.isArray(rawOptions)) {
    if (rawOptions.length > 0 && typeof rawOptions[0] === "string") {
      const letters = ["A", "B", "C", "D", "E"];
      qOptions = rawOptions.map((text: string, i: number) => ({
        key: letters[i] || String(i),
        text,
      }));
    } else {
      qOptions = rawOptions.map((opt: any, i: number) => ({
        key: opt.key || opt.id || opt.letra || ["A", "B", "C", "D", "E"][i] || String(i),
        text: opt.text || opt.value || opt.texto || opt.descricao || "",
      }));
    }
  } else if (typeof rawOptions === "object" && rawOptions !== null) {
    qOptions = Object.entries(rawOptions).map(([k, v]) => ({
      key: k,
      text: String(v),
    }));
  }

  return {
    qText,
    qAnswer,
    qFeedback,
    qFonte,
    qOptionExplanations,
    qOptions,
  };
}

export default function WizardStep3() {
  const mode = useQuizStore((s) => s.mode);
  const filters = useQuizStore((s) => s.filters);
  const freeStudy = useQuizStore((s) => s.freeStudy);
  const setStep = useQuizStore((s) => s.setStep);
  const generatedQuestions = useQuizStore((s) => s.generatedQuestions);
  const setGeneratedQuestions = useQuizStore((s) => s.setGeneratedQuestions);

  const [loading, setLoading] = useState(!generatedQuestions.length);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<(string | null)[]>([]);
  const [results, setResults] = useState<(boolean | null)[]>([]);
  const [expandedResolutions, setExpandedResolutions] = useState<boolean[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

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
      return () => abortRef.current?.abort();
    }

    if (generatedQuestions.length > 0) {
      setSelectedOptions((current) =>
        current.length === generatedQuestions.length
          ? current
          : new Array(generatedQuestions.length).fill(null)
      );
      setResults((current) =>
        current.length === generatedQuestions.length
          ? current
          : new Array(generatedQuestions.length).fill(null)
      );
      setExpandedResolutions((current) =>
        current.length === generatedQuestions.length
          ? current
          : new Array(generatedQuestions.length).fill(false)
      );
      setCurrentQuestionIndex((current) =>
        Math.min(current, Math.max(0, generatedQuestions.length - 1))
      );
    }

    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      try {
        rawText = await res.text();
      } catch {
        throw new Error("Falha ao ler resposta da rede.");
      }

      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`[JSON_PARSE_ERROR]: ${rawText.substring(0, 150)}`);
      }

      if (!res.ok) throw new Error(data?.error || data?.userMessage || `Erro HTTP ${res.status}`);
      if (data?.success === false) throw new Error(data?.error || data?.userMessage || "Falha ao processar requisicao.");
      if (!Array.isArray(data?.questions) || data.questions.length === 0) {
        throw new Error(data?.userMessage || "O formato da resposta nao e valido ou nenhuma questao foi retornada.");
      }

      setGeneratedQuestions(data.questions);
      setSelectedOptions(new Array(data.questions.length).fill(null));
      setResults(new Array(data.questions.length).fill(null));
      setExpandedResolutions(new Array(data.questions.length).fill(false));
      setCurrentQuestionIndex(0);
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

  const handleBackToStep2 = () => {
    setGeneratedQuestions([]);
    setStep(2);
  };

  const handleSelectOption = (idx: number, key: string) => {
    if (results[idx] !== null) return;
    setSelectedOptions((current) => {
      const next = [...current];
      next[idx] = key;
      return next;
    });
  };

  const handleConfirmAnswer = (idx: number) => {
    const selected = selectedOptions[idx];
    if (!selected) return;

    const isCorrect = selected === normalizeQuestion(generatedQuestions[idx]).qAnswer;

    setResults((current) => {
      const next = [...current];
      next[idx] = isCorrect;
      return next;
    });

    setExpandedResolutions((current) => {
      const next = [...current];
      next[idx] = true;
      return next;
    });
  };

  const handleToggleResolution = (idx: number) => {
    if (results[idx] === null) return;
    setExpandedResolutions((current) => {
      const next = [...current];
      next[idx] = !next[idx];
      return next;
    });
  };

  const handleQuestionNav = (delta: number) => {
    setCurrentQuestionIndex((current) => {
      const next = current + delta;
      return Math.max(0, Math.min(generatedQuestions.length - 1, next));
    });
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
        <div
          style={{
            padding: "var(--space-8)",
            background: "rgba(251,235,208,0.03)",
            border: "1px solid rgba(196,18,48,0.3)",
            borderRadius: "2px",
            textAlign: "center",
            boxShadow: "4px 4px 0 rgba(107,0,0,0.25)",
          }}
        >
          <div style={{ marginBottom: "var(--space-3)", color: "var(--elite-red)", display: "flex", justifyContent: "center" }}>
            <AlertTriangle width={48} height={48} />
          </div>
          <h3 style={{ marginBottom: "var(--space-2)", color: "var(--elite-cream)" }}>Ops! Geracao Interrompida</h3>
          <p style={{ color: "var(--elite-grayblue)", fontSize: "1.05rem", marginBottom: "24px" }}>{error}</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn btn-secondary"
              style={{ borderRadius: "2px", border: "1px solid rgba(107,153,179,0.25)", background: "transparent", color: "var(--elite-grayblue)" }}
              onClick={handleBackToStep2}
            >
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
    return <h2 className="text-white text-2xl text-center p-10">ERRO: Nenhuma questao chegou neste componente. O Array esta vazio.</h2>;
  }

  const activeQuestionIndex = Math.max(0, Math.min(currentQuestionIndex, generatedQuestions.length - 1));
  const activeQuestion = generatedQuestions[activeQuestionIndex];

  return (
    <div className="relative w-full max-w-6xl mx-auto px-4 md:px-6 py-5 md:py-8 pb-40 md:pb-12">
      <div className="mb-6 md:mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[rgba(107,153,179,0.8)]">
            Caderno de questoes
          </p>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight text-[var(--elite-cream)]">
            {mode === "concurso" ? filters.materia || "Questoes" : "Questoes"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm md:text-base leading-relaxed text-[rgba(107,153,179,0.92)]">
            Responda primeiro, confira a resolucao depois e navegue com fluidez entre desktop e mobile.
          </p>
        </div>

        <button
          onClick={handleBackToStep2}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[rgba(107,153,179,0.22)] bg-[rgba(251,235,208,0.03)] px-4 py-2 text-sm font-semibold text-[var(--elite-cream)] transition-colors hover:border-[rgba(196,18,48,0.45)] hover:bg-[rgba(196,18,48,0.08)]"
        >
          <Filter size={16} />
          Alterar filtros
        </button>
      </div>

      {!isDesktop ? (
        <>
          <div className="mb-4 flex items-center justify-between rounded-[8px] border border-[rgba(107,153,179,0.18)] bg-[rgba(251,235,208,0.03)] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[rgba(107,153,179,0.85)]">
            <span>Questao ativa</span>
            <span>
              {activeQuestionIndex + 1} de {generatedQuestions.length}
            </span>
          </div>

          <QuestionCard
            question={activeQuestion}
            idx={activeQuestionIndex}
            filters={filters}
            compact
            isAnswered={results[activeQuestionIndex] !== null}
            isCorrect={results[activeQuestionIndex]}
            selectedOption={selectedOptions[activeQuestionIndex]}
            isResolutionOpen={expandedResolutions[activeQuestionIndex]}
            onSelect={(key: string) => handleSelectOption(activeQuestionIndex, key)}
            onAnswer={() => handleConfirmAnswer(activeQuestionIndex)}
            onToggleResolution={() => handleToggleResolution(activeQuestionIndex)}
          />

          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgba(107,153,179,0.2)] bg-white/98 px-4 py-3 shadow-[0_-10px_28px_rgba(0,0,0,0.12)] backdrop-blur md:hidden">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <button
                disabled={activeQuestionIndex === 0}
                onClick={() => handleQuestionNav(-1)}
                className="inline-flex min-w-[88px] items-center justify-center gap-1.5 rounded-[8px] border border-[rgba(107,153,179,0.18)] px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[rgba(196,18,48,0.35)] hover:text-[var(--elite-red)] disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <ChevronLeft size={18} />
                Anterior
              </button>

              <div className="flex flex-1 items-center justify-center">
                <div className="rounded-[8px] border border-[rgba(107,153,179,0.18)] bg-[rgba(10,46,69,0.04)] px-4 py-2 text-sm font-semibold text-slate-700">
                  Questao {activeQuestionIndex + 1} de {generatedQuestions.length}
                </div>
              </div>

              <button
                disabled={activeQuestionIndex === generatedQuestions.length - 1}
                onClick={() => handleQuestionNav(1)}
                className="inline-flex min-w-[88px] items-center justify-center gap-1.5 rounded-[8px] border border-[rgba(107,153,179,0.18)] px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[rgba(196,18,48,0.35)] hover:text-[var(--elite-red)] disabled:cursor-not-allowed disabled:text-slate-300"
              >
                Proximo
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {generatedQuestions.map((question: any, idx: number) => (
            <QuestionCard
              key={idx}
              question={question}
              idx={idx}
              filters={filters}
              compact={false}
              isAnswered={results[idx] !== null}
              isCorrect={results[idx]}
              selectedOption={selectedOptions[idx]}
              isResolutionOpen={expandedResolutions[idx]}
              onSelect={(key: string) => handleSelectOption(idx, key)}
              onAnswer={() => handleConfirmAnswer(idx)}
              onToggleResolution={() => handleToggleResolution(idx)}
            />
          ))}
        </div>
      )}

      {showExitModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-[8px] bg-[var(--elite-navy)] p-6 shadow-[4px_4px_0_rgba(107,0,0,0.3)] border border-[rgba(107,153,179,0.18)]">
            <h3 className="mb-2 text-xl font-bold text-[var(--elite-cream)]">Sair do modo foco?</h3>
            <p className="mb-6 text-sm leading-relaxed text-[rgba(107,153,179,0.92)]">
              Seu progresso nesta sessao sera perdido. Deseja sair?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[var(--elite-red)] px-4 py-3 font-bold text-[var(--elite-cream)] shadow-[4px_4px_0_var(--elite-wine)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <BookOpen size={18} />
                Continuar estudando
              </button>
              <button
                onClick={() => {
                  setShowExitModal(false);
                  handleBackToStep2();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-[rgba(107,153,179,0.22)] bg-transparent px-4 py-3 font-bold text-[rgba(107,153,179,0.95)] transition-colors hover:bg-[rgba(107,153,179,0.08)] hover:text-[var(--elite-cream)]"
              >
                <RotateCcw size={18} />
                Sair e comecar novo quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  idx,
  filters,
  compact,
  isAnswered,
  isCorrect,
  selectedOption,
  isResolutionOpen,
  onSelect,
  onAnswer,
  onToggleResolution,
}: any) {
  const data = normalizeQuestion(question);

  const baseCardClasses = compact
    ? "w-full rounded-[10px] border border-[rgba(107,153,179,0.18)] bg-[rgba(251,235,208,0.04)] px-4 py-5 shadow-[4px_4px_0_rgba(107,0,0,0.2)] md:px-6 md:py-7"
    : "w-full rounded-[10px] border border-[rgba(107,153,179,0.18)] bg-[rgba(251,235,208,0.04)] px-5 py-6 shadow-[4px_4px_0_rgba(107,0,0,0.2)] md:px-8 md:py-8";

  return (
    <article className={baseCardClasses}>
      <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[rgba(107,153,179,0.86)]">
        <span className="rounded-[6px] border border-[rgba(107,153,179,0.18)] bg-[rgba(10,46,69,0.16)] px-2.5 py-1 text-[var(--elite-cream)]">
          Q{idx + 1}
        </span>
        <span className="rounded-[6px] border border-[rgba(107,153,179,0.18)] px-2.5 py-1">Inedita</span>
        {filters.materia && filters.materia !== "Todas" && (
          <span className="rounded-[6px] border border-[rgba(107,153,179,0.18)] px-2.5 py-1">{filters.materia}</span>
        )}
        {filters.banca && filters.banca !== "Todas" && (
          <span className="rounded-[6px] border border-[rgba(107,153,179,0.18)] px-2.5 py-1">{filters.banca}</span>
        )}
      </div>

      <p className="mb-6 whitespace-pre-wrap text-lg leading-relaxed text-[var(--elite-cream)] md:text-xl">
        {data.qText}
      </p>

      <div className="flex flex-col gap-3">
        {data.qOptions.map((opt) => (
          <OptionButton
            key={opt.key}
            opt={opt}
            isSelected={selectedOption === opt.key}
            isAnswered={isAnswered}
            correctAnswer={data.qAnswer}
            onSelect={() => onSelect(opt.key)}
          />
        ))}
      </div>

      {!isAnswered ? (
        <div className="mt-5">
          <button
            disabled={!selectedOption}
            onClick={onAnswer}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--elite-red)] px-6 py-3.5 font-bold text-[var(--elite-cream)] shadow-[4px_4px_0_var(--elite-wine)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            Responder
          </button>
        </div>
      ) : (
        <div className="mt-5 rounded-[8px] border border-[rgba(107,153,179,0.18)] bg-[rgba(10,46,69,0.18)] px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--elite-cream)]">
            <span className="inline-flex items-center gap-2">
              {isCorrect ? (
                <>
                  <CheckCircle size={16} className="text-emerald-400" />
                  Resposta correta
                </>
              ) : (
                <>
                  <XCircle size={16} className="text-red-400" />
                  Resposta registrada
                </>
              )}
            </span>
            <span className="text-[rgba(107,153,179,0.9)]">
              {selectedOption ? `Sua escolha: ${selectedOption}` : "Sem alternativa selecionada"}
            </span>
          </div>
        </div>
      )}

      {isAnswered && (
        <div className="mt-4 border-t border-[rgba(107,153,179,0.16)] pt-4">
          <div className={compact ? "grid grid-cols-2 gap-2 md:flex md:flex-wrap" : "flex flex-wrap gap-2"}>
            <button
              onClick={onToggleResolution}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-[rgba(196,18,48,0.22)] bg-[rgba(196,18,48,0.08)] px-3 py-2 text-sm font-semibold text-[var(--elite-cream)] transition-colors hover:border-[rgba(196,18,48,0.45)] hover:bg-[rgba(196,18,48,0.15)]"
            >
              <GraduationCap size={16} />
              {isResolutionOpen ? "Ocultar resolucao" : "Gabarito comentado"}
            </button>
            <button
              onClick={() => window.alert("Estatisticas: em breve")}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-[rgba(107,153,179,0.18)] bg-[rgba(251,235,208,0.03)] px-3 py-2 text-sm font-semibold text-[rgba(107,153,179,0.95)] transition-colors hover:border-[rgba(107,153,179,0.32)] hover:text-[var(--elite-cream)]"
            >
              <BarChart2 size={16} />
              Estatisticas
            </button>
            <button
              onClick={() => window.alert("Criar anotacoes: em breve")}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-[rgba(107,153,179,0.18)] bg-[rgba(251,235,208,0.03)] px-3 py-2 text-sm font-semibold text-[rgba(107,153,179,0.95)] transition-colors hover:border-[rgba(107,153,179,0.32)] hover:text-[var(--elite-cream)]"
            >
              <Edit3 size={16} />
              Criar anotacoes
            </button>
            <button
              onClick={() => window.alert("Notificar erro: em breve")}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-[rgba(107,153,179,0.18)] bg-[rgba(251,235,208,0.03)] px-3 py-2 text-sm font-semibold text-[rgba(107,153,179,0.95)] transition-colors hover:border-[rgba(107,153,179,0.32)] hover:text-[var(--elite-cream)]"
            >
              <Flag size={16} />
              Notificar erro
            </button>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              isResolutionOpen ? "mt-4 max-h-[4000px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="relative overflow-hidden rounded-[8px] border border-[rgba(107,153,179,0.18)] bg-[rgba(10,46,69,0.55)] px-4 py-4">
              <div className="absolute left-0 top-0 h-full w-1 bg-[var(--elite-red)]" />
              <div className="flex items-center gap-2 pl-2 text-sm font-bold text-[var(--elite-cream)]">
                <Brain size={16} className="text-[var(--elite-red)]" />
                Gabarito comentado / resolucao
              </div>

              <div className="mt-3 whitespace-pre-wrap pl-2 text-sm leading-relaxed text-[rgba(251,235,208,0.88)] md:text-[0.95rem]">
                {data.qFeedback}
              </div>

              {Object.keys(data.qOptionExplanations).length > 0 && (
                <div className="mt-4 space-y-3 pl-2">
                  <h5 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[rgba(107,153,179,0.88)]">
                    Analise das alternativas
                  </h5>
                  {Object.entries(data.qOptionExplanations).map(([key, exp]) => {
                    const isRight = String(key).toLowerCase() === String(data.qAnswer).toLowerCase();
                    return (
                      <div
                        key={key}
                        className={`rounded-[8px] border px-3 py-3 text-sm ${
                          isRight
                            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                            : "border-[rgba(107,153,179,0.16)] bg-[rgba(251,235,208,0.03)] text-[rgba(251,235,208,0.88)]"
                        }`}
                      >
                        <span className={`mr-2 font-bold ${isRight ? "text-emerald-300" : "text-[var(--elite-cream)]"}`}>
                          {key})
                        </span>
                        <span>{String(exp)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {data.qFonte && (
                <div className="mt-4 pl-2">
                  <span className="inline-flex rounded-[6px] border border-[rgba(107,153,179,0.18)] bg-[rgba(251,235,208,0.04)] px-3 py-1 text-xs font-medium text-[rgba(107,153,179,0.9)]">
                    Fonte: {data.qFonte}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function OptionButton({ opt, isSelected, isAnswered, correctAnswer, onSelect }: any) {
  const isRight = String(opt.key).toLowerCase() === String(correctAnswer).toLowerCase();
  const isWrong = isAnswered && isSelected && !isRight;

  let container =
    "w-full text-left rounded-[8px] border px-4 py-4 flex items-start gap-3 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(196,18,48,0.45)]";

  if (!isAnswered) {
    container += isSelected
      ? " border-[rgba(196,18,48,0.72)] bg-[rgba(196,18,48,0.12)] shadow-[2px_2px_0_rgba(107,0,0,0.16)] cursor-pointer"
      : " border-[rgba(107,153,179,0.2)] bg-[rgba(251,235,208,0.03)] hover:border-[rgba(196,18,48,0.38)] hover:bg-[rgba(196,18,48,0.05)] cursor-pointer";
  } else if (isRight) {
    container += " border-emerald-400/40 bg-emerald-500/10 cursor-default";
  } else if (isWrong) {
    container += " border-red-400/40 bg-red-500/10 cursor-default";
  } else {
    container += " border-[rgba(107,153,179,0.14)] bg-[rgba(251,235,208,0.02)] opacity-55 cursor-default";
  }

  let circle =
    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-sm font-black transition-all";

  if (!isAnswered) {
    circle += isSelected
      ? " border-[var(--elite-red)] bg-[var(--elite-red)] text-[var(--elite-cream)]"
      : " border-[rgba(107,153,179,0.28)] bg-[rgba(10,46,69,0.28)] text-[var(--elite-cream)]";
  } else if (isRight) {
    circle += " border-emerald-500 bg-emerald-500 text-white";
  } else if (isWrong) {
    circle += " border-red-500 bg-red-500 text-white";
  } else {
    circle += " border-[rgba(107,153,179,0.28)] bg-[rgba(10,46,69,0.28)] text-[rgba(107,153,179,0.95)]";
  }

  return (
    <button className={container} onClick={() => !isAnswered && onSelect()} disabled={isAnswered}>
      <span className={circle}>{String(opt.key).toUpperCase()}</span>
      <span className={`flex-1 text-base leading-snug ${isAnswered && (isRight || isWrong) ? "font-semibold text-[var(--elite-cream)]" : "text-[rgba(251,235,208,0.9)]"}`}>
        {opt.text}
      </span>
      {isAnswered && isRight && <CheckCircle size={22} className="mt-0.5 flex-shrink-0 text-emerald-400" />}
      {isAnswered && isWrong && <XCircle size={22} className="mt-0.5 flex-shrink-0 text-red-400" />}
    </button>
  );
}
