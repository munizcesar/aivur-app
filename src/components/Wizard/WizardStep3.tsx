"use client";

import React, { useEffect, useState, useRef } from "react";
import { useQuizStore } from "@/store/useQuizStore";
import { 
  AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, 
  CheckCircle, XCircle, Brain, RotateCcw, BookOpen,
  Filter, BarChart2, Edit3, Flag 
} from "lucide-react";
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
    if (!loading && !error && generatedQuestions.length > 0) {
      window.history.pushState({ quizActive: true }, "");
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        setShowExitModal(true);
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
  }, []);

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
        throw new Error(data.userMessage || 'O formato da resposta não é válido ou nenhuma questão foi retornada.');
      }

      setGeneratedQuestions(data.questions as any[]);
      setSelectedOptions(new Array(data.questions.length).fill(null));
      setResults(new Array(data.questions.length).fill(null));
      setCurrentIdx(0);
      setLoading(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Tempo esgotado (timeout). O servidor demorou muito para responder.');
      } else {
        setError('Ocorreu uma instabilidade na conexão com a IA. Tente novamente em instantes.');
      }
      setLoading(false);
    }
  };

  const handleBackToStep2 = () => {
    setGeneratedQuestions([]);
    setStep(2);
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    handleBackToStep2();
  };

  const handleSelectOption = (idx: number, key: string) => {
    if (results[idx] !== null) return;
    const newSelected = [...selectedOptions];
    newSelected[idx] = key;
    setSelectedOptions(newSelected);
  };

  const handleConfirmAnswer = (idx: number) => {
    const q = generatedQuestions[idx];
    const userSelected = selectedOptions[idx];
    if (!userSelected) return;
    const isCorrect = userSelected === q.answer;
    const newResults = [...results];
    newResults[idx] = isCorrect;
    setResults(newResults);
  };

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
          <p style={{ color: "var(--elite-grayblue)", fontSize: "1.05rem", marginBottom: "24px" }}>{error}</p>
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

  return (
    <div className="fixed inset-0 z-[100] bg-[#f4f6f8] overflow-y-auto flex flex-col items-center md:py-8 text-gray-900 w-full h-full">
      
      {/* Mobile Top Header */}
      <div className="md:hidden w-full bg-[#f68b33] text-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <button onClick={() => setShowExitModal(true)} className="p-1 -ml-1 hover:bg-[#e07722] rounded transition-colors">
          <ChevronLeft size={24} />
        </button>
        <span className="font-semibold text-lg truncate max-w-[200px]">
          {mode === 'concurso' ? filters.materia || 'Questões' : 'Questões'}
        </span>
        <button onClick={handleBackToStep2} className="p-1 -mr-1 hover:bg-[#e07722] rounded transition-colors" title="Voltar aos Filtros">
          <Filter size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-4xl mx-auto pb-24 md:pb-8 space-y-0 md:space-y-6 flex-1 md:px-4">
        {generatedQuestions.map((question, idx) => {
          const showMobile = idx === currentIdx;
          const isAnswered = results[idx] !== null;
          const isCorrect = results[idx];
          const selectedOption = selectedOptions[idx];

          return (
            <QuestionCard 
              key={idx}
              question={question}
              idx={idx}
              total={generatedQuestions.length}
              filters={filters}
              showMobile={showMobile}
              isAnswered={isAnswered}
              isCorrect={isCorrect}
              selectedOption={selectedOption}
              onSelect={(optionKey: string) => handleSelectOption(idx, optionKey)}
              onAnswer={() => handleConfirmAnswer(idx)}
              onFilterClick={handleBackToStep2}
            />
          );
        })}
      </div>

      {/* Bottom Bar Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex justify-between items-center p-4 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]">
        <button 
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          className="flex items-center gap-1 font-medium text-gray-600 hover:text-[#f68b33] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={20} /> Anterior
        </button>
        <div className="font-semibold text-gray-800 border border-gray-200 px-4 py-1.5 rounded-full text-sm shadow-sm bg-gray-50">
          Questão {currentIdx + 1} de {generatedQuestions.length}
        </div>
        <button 
          disabled={currentIdx === generatedQuestions.length - 1}
          onClick={() => setCurrentIdx(Math.min(generatedQuestions.length - 1, currentIdx + 1))}
          className="flex items-center gap-1 font-medium text-gray-600 hover:text-[#f68b33] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Próximo <ChevronRight size={20} />
        </button>
      </div>

      {/* Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sair do Modo Foco?</h3>
            <p className="text-gray-600 mb-6">Seu progresso nesta sessão será perdido. Deseja sair e iniciar um novo quiz?</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowExitModal(false)}
                className="w-full py-3 px-4 bg-[#f68b33] hover:bg-[#e07722] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen size={18} /> Continuar estudando
              </button>
              <button 
                onClick={handleConfirmExit}
                className="w-full py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} /> Sair e começar novo quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionCard({ 
  question, idx, total, filters, showMobile, 
  isAnswered, isCorrect, selectedOption, 
  onSelect, onAnswer, onFilterClick 
}: any) {
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (isAnswered) {
      setShowExplanation(true);
    }
  }, [isAnswered]);

  return (
    <div className={`bg-white md:rounded-lg md:shadow-sm md:border md:border-gray-200 ${showMobile ? 'block' : 'hidden md:block'} w-full md:mb-8`}>
      {/* Header Info Desktop */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 font-medium">
           <span className="font-bold text-gray-400 mr-2">Q{idx + 1}</span>
           <span className="bg-white border border-gray-200 shadow-sm px-2.5 py-1 rounded-md text-gray-700">Origem: Questão Inédita (IA)</span>
           <span className="bg-white border border-gray-200 shadow-sm px-2.5 py-1 rounded-md text-gray-700">Estilo: {filters.banca && filters.banca !== 'Todas' ? filters.banca : 'Personalizado'}</span>
           <span className="bg-white border border-gray-200 shadow-sm px-2.5 py-1 rounded-md text-gray-700">Disciplina: {filters.materia || 'Variada'}</span>
        </div>
        <button onClick={onFilterClick} className="p-2 text-[#f68b33] hover:bg-orange-50 rounded-full transition-colors" title="Voltar aos Filtros">
          <Filter size={18} />
        </button>
      </div>

      {/* Mobile-only header line (metadata) */}
      <div className="md:hidden p-4 pb-0 flex flex-wrap gap-2 text-[10px] sm:text-xs text-gray-600">
        <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-700 font-medium">Inédita (IA)</span>
        <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-700 font-medium">{filters.banca && filters.banca !== 'Todas' ? filters.banca : 'Personalizado'}</span>
        <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-700 font-medium truncate max-w-[150px]">{filters.materia || 'Variada'}</span>
      </div>

      {/* Body */}
      <div className="p-4 md:p-6 md:pt-6 pt-4">
        
        <div className="text-gray-800 text-base md:text-[17px] mb-8 whitespace-pre-wrap leading-relaxed font-medium">
          {question.text}
        </div>
        
        <div className="space-y-3 mb-6">
           {question.options?.map((opt: any) => (
             <QuizOptionTailwind
                key={opt.key}
                opt={opt}
                isSelected={selectedOption === opt.key}
                isAnswered={isAnswered}
                isCorrect={isCorrect}
                questionAnswer={question.answer}
                onSelect={() => onSelect(opt.key)}
             />
           ))}
        </div>
        
        {/* Responder Button */}
        {!isAnswered && (
          <div className="pt-2">
            <button 
               disabled={!selectedOption}
               onClick={onAnswer}
               className="w-full md:w-auto px-10 py-3.5 bg-[#f68b33] hover:bg-[#e07722] disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold rounded-lg transition-colors shadow-sm"
            >
              Responder
            </button>
          </div>
        )}

        {/* Action Bar */}
        {isAnswered && (
          <div className="mt-8 border-t border-gray-100 pt-5">
             <div className="flex flex-wrap gap-2 md:gap-4 text-sm font-medium text-gray-600 mb-4">
                <button 
                  onClick={() => setShowExplanation(!showExplanation)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${showExplanation ? 'text-[#f68b33] bg-orange-50' : 'hover:bg-gray-100'}`}
                >
                  <BookOpen size={16} /> Gabarito Comentado
                </button>
                <button onClick={() => alert('Estatísticas: Em breve')} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
                  <BarChart2 size={16} /> Estatísticas
                </button>
                <button onClick={() => alert('Criar Anotações: Em breve')} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
                  <Edit3 size={16} /> Criar Anotações
                </button>
                <button onClick={() => alert('Notificar Erro: Em breve')} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
                  <Flag size={16} /> Notificar Erro
                </button>
             </div>
             
             {/* Explanation */}
             <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showExplanation ? 'max-h-[2000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                <div className="p-5 md:p-6 bg-[#f9fafb] rounded-xl border border-gray-200/60 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#f68b33]"></div>
                  <h4 className="font-bold flex items-center gap-2 mb-3 text-gray-800 text-[15px]">
                    <Brain size={18} className="text-[#f68b33]" /> Resolução da IA
                  </h4>
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-[15px]">
                    {question.feedback}
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}

function QuizOptionTailwind({ opt, isSelected, isAnswered, isCorrect, questionAnswer, onSelect }: any) {
  let containerClasses = "p-3.5 md:p-4 rounded-xl border-2 flex items-center gap-4 transition-all duration-200 ";
  let labelClasses = "w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-200 ";
  
  if (!isAnswered) {
    containerClasses += "cursor-pointer ";
    if (isSelected) {
      containerClasses += "border-[#f68b33] bg-orange-50/40";
      labelClasses += "bg-[#f68b33] border-[#f68b33] text-white";
    } else {
      containerClasses += "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50";
      labelClasses += "bg-transparent border-gray-300 text-gray-500";
    }
  } else {
    // Answered state
    containerClasses += "cursor-default ";
    
    if (opt.key === questionAnswer) {
      // The correct answer
      containerClasses += "border-[#22c55e] bg-green-50/30 z-10 relative ";
      labelClasses += "bg-[#22c55e] border-[#22c55e] text-white";
    } else if (isSelected && !isCorrect) {
      // The wrong answer selected by user
      containerClasses += "border-[#ef4444] bg-red-50/30 z-10 relative ";
      labelClasses += "bg-[#ef4444] border-[#ef4444] text-white";
    } else {
      // Other options
      containerClasses += "border-gray-100 bg-white opacity-40 ";
      labelClasses += "bg-transparent border-gray-200 text-gray-400";
    }
  }

  return (
    <div className={containerClasses} onClick={() => !isAnswered && onSelect()}>
      <div className={labelClasses}>
        {opt.key.toUpperCase()}
      </div>
      <div className={`flex-1 text-[15px] md:text-base leading-snug ${isAnswered && (opt.key === questionAnswer || (isSelected && !isCorrect)) ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
        {opt.text}
      </div>
      {isAnswered && opt.key === questionAnswer && <CheckCircle className="text-[#22c55e] shrink-0" size={22} />}
      {isAnswered && isSelected && !isCorrect && <XCircle className="text-[#ef4444] shrink-0" size={22} />}
    </div>
  );
}
