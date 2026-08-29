"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

export interface UniversalQuestion {
  id: string;
  enunciado: string;
  alternativas: Record<string, string>;
  correta: string;
  justificativa: string;
}

interface FullscreenQuestionProps {
  question: UniversalQuestion;
  index: number;
  total: number;
  subject: string;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onAnswer: (optionId: string, isCorrect: boolean) => void;
  userResponse?: string;
}

export function FullscreenQuestion({
  question,
  index,
  total,
  subject,
  onBack,
  onPrev,
  onNext,
  onAnswer,
  userResponse,
}: FullscreenQuestionProps) {
  const [selected, setSelected] = useState<string | null>(userResponse || null);
  const [answered, setAnswered] = useState(!!userResponse);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSelected(userResponse || null);
    setAnswered(!!userResponse);
  }, [question.id, userResponse]);

  function handleSelect(optionId: string) {
    if (answered) return;
    setSelected(optionId);
  }

  function handleSubmit() {
    if (!selected || answered) return;
    const isCorrect = selected === question.correta;
    setAnswered(true);
    onAnswer(selected, isCorrect);
  }

  function getOptionState(optionId: string) {
    if (!answered) {
      return selected === optionId ? "selected" : "default";
    }
    if (optionId === question.correta) return "correct";
    if (optionId === selected) return "incorrect";
    return "disabled";
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] w-screen h-screen flex flex-col bg-slate-950 overflow-y-auto m-0 p-0">
      <header className="flex items-center gap-3 px-4 py-3 shrink-0 bg-slate-900 border-b border-slate-800 text-slate-100">
        <button onClick={onBack} aria-label="Voltar" className="p-1 rounded-full active:opacity-70 hover:bg-slate-800">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{subject}</p>
        </div>
      </header>

      <div className="px-4 py-3 flex items-center justify-between text-xs shrink-0 border-b border-slate-800 text-slate-400 bg-slate-900">
        <span className="font-bold text-base text-slate-100">
          {index} <span className="font-normal text-xs text-slate-400">de {total}</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 bg-slate-950">
        <p className="text-base leading-relaxed mb-6 font-medium text-slate-100">
          {question.enunciado}
        </p>

        <div className="flex flex-col gap-3">
          {Object.entries(question.alternativas).map(([letra, texto]) => {
            const state = getOptionState(letra);
            
            return (
              <button
                key={letra}
                onClick={() => handleSelect(letra)}
                disabled={answered}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  state === 'selected' ? 'border-blue-500 bg-blue-500/10' :
                  state === 'correct' ? 'border-green-500 bg-green-500/10' :
                  state === 'incorrect' ? 'border-red-500 bg-red-500/10' :
                  'border-slate-800 bg-slate-800 hover:bg-slate-700'
                }`}
              >
                <span className={`flex-none w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold border-2 ${
                  state === 'selected' ? 'bg-blue-500 border-blue-500 text-white' :
                  state === 'correct' ? 'bg-green-500 border-green-500 text-white' :
                  state === 'incorrect' ? 'bg-red-500 border-red-500 text-white' :
                  'bg-slate-900 border-slate-600 text-slate-300'
                }`}>
                  {letra}
                </span>
                <span className="text-sm leading-relaxed text-slate-200 mt-0.5">
                  {texto}
                </span>
              </button>
            );
          })}
        </div>
        
        {answered && (
          <div className={`mt-6 p-4 rounded-xl shadow-sm bg-slate-800 border-l-4 ${selected === question.correta ? 'border-green-500' : 'border-red-500'}`}>
            <p className={`font-bold mb-2 text-sm ${selected === question.correta ? 'text-green-500' : 'text-red-500'}`}>
              {selected === question.correta ? 'Correto. Você acertou!' : 'Incorreto. Você errou!'}
            </p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {question.justificativa}
            </p>
          </div>
        )}
        
        {/* Spacer for bottom bar */}
        <div className="h-24"></div>
      </div>

      <div className="px-4 py-4 shrink-0 shadow-lg flex items-center justify-between bg-slate-900 border-t border-slate-800">
        <button
          onClick={onPrev}
          disabled={index === 1}
          className="p-2 rounded-full disabled:opacity-30 text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft size={28} />
        </button>

        {!answered ? (
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className={`px-8 py-3 rounded-full font-bold shadow-md transition-all disabled:opacity-50 ${
              selected ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-800 text-slate-400'
            }`}
          >
            CONFIRMAR
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={index === total}
            className={`px-8 py-3 rounded-full font-bold shadow-md transition-all disabled:opacity-50 ${
              index < total ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {index < total ? 'PRÓXIMA' : 'FINALIZAR'}
          </button>
        )}

        <button
          onClick={onNext}
          disabled={index === total}
          className="p-2 rounded-full disabled:opacity-30 text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <ChevronRight size={28} />
        </button>
      </div>
    </div>,
    document.body
  );
}