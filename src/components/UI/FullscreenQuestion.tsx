"use client";

import { useState, useEffect, useRef } from "react";
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
  const [eliminated, setEliminated] = useState<string[]>([]);
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [justSwiped, setJustSwiped] = useState(false);
  const actionAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && actionAreaRef.current) {
      setTimeout(() => {
        actionAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  }, [selected, answered]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSelected(userResponse || null);
    setAnswered(!!userResponse);
    setEliminated([]);
  }, [question.id, userResponse]);

  function handleSelect(optionId: string) {
    if (answered || justSwiped) return;
    setSelected(optionId);
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent, optId: string) => {
    if (!touchStart) return;
    const deltaX = e.changedTouches[0].clientX - touchStart.x;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStart.y);

    if (Math.abs(deltaX) > 40 && deltaY < 30) {
      setEliminated(prev => prev.includes(optId) ? prev.filter(id => id !== optId) : [...prev, optId]);
      setJustSwiped(true);
      setTimeout(() => setJustSwiped(false), 200);
    }
    setTouchStart(null);
  };

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
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, letra)}
                disabled={answered}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  state === 'selected' ? 'border-blue-500 bg-blue-500/10' :
                  state === 'correct' ? 'border-green-500 bg-green-500/10' :
                  state === 'incorrect' ? 'border-red-500 bg-red-500/10' :
                  'border-slate-800 bg-slate-800 hover:bg-slate-700'
                } ${eliminated.includes(letra) && state === 'default' ? 'opacity-40' : ''}`}
              >
                <span className={`flex-none w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold border-2 ${
                  state === 'selected' ? 'bg-blue-500 border-blue-500 text-white' :
                  state === 'correct' ? 'bg-green-500 border-green-500 text-white' :
                  state === 'incorrect' ? 'bg-red-500 border-red-500 text-white' :
                  'bg-slate-900 border-slate-600 text-slate-300'
                }`}>
                  {letra}
                </span>
                <span className={`text-sm leading-relaxed mt-0.5 ${eliminated.includes(letra) && state === 'default' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {texto}
                </span>
              </button>
            );
          })}
        </div>
        
        <div ref={actionAreaRef} className="mt-4 pb-4">
          {!answered && (
            <button
              onClick={handleSubmit}
              disabled={!selected}
              className={`w-full px-8 py-4 mt-2 rounded-xl font-bold shadow-md transition-all disabled:opacity-50 ${
                selected ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-800 text-slate-400'
              }`}
            >
              CONFIRMAR
            </button>
          )}

          {answered && (
            <div className="mt-2 w-full animate-in fade-in duration-300 pb-4">
              <div className="flex items-center gap-2 text-[#f68b33] font-bold mb-3">
                🎓 Mentor AIVUR
              </div>
              <div className="p-4 bg-orange-50 dark:bg-[#f68b33]/10 border border-[#f68b33]/30 rounded-xl text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {question.justificativa || (selected === question.correta ? "Resposta correta!" : `Resposta incorreta. Gabarito: ${question.correta}.`)}
              </div>
              
              <button
                onClick={onNext}
                disabled={index === total}
                className={`w-full mt-6 px-8 py-4 rounded-xl font-bold shadow-md transition-all disabled:opacity-50 ${
                  index < total ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {index < total ? 'PRÓXIMA' : 'FINALIZAR'}
              </button>
            </div>
          )}
        </div>
        
        {/* Spacer for bottom bar */}
        <div className="h-24"></div>
      </div>

      <div className="px-4 py-4 shrink-0 shadow-lg flex items-center justify-between bg-slate-900 border-t border-slate-800">
        <button
          onClick={onPrev}
          disabled={index === 1}
          className="p-2 rounded-full disabled:opacity-30 text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <ChevronLeft size={28} />
        </button>

        <span className="text-sm font-semibold text-slate-400">Navegação</span>

        <button
          onClick={onNext}
          disabled={index === total}
          className="p-2 rounded-full disabled:opacity-30 text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <ChevronRight size={28} />
        </button>
      </div>
    </div>,
    document.body
  );
}