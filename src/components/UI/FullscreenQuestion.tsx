"use client";

import { useState, useEffect, useRef } from "react";

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

  return (
    <div className="fixed inset-0 z-[99999] w-screen h-screen flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-y-auto m-0 p-0">
      <header className="flex items-center gap-3 px-4 py-3 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
        <button onClick={onBack} aria-label="Voltar" className="p-1 rounded-full active:opacity-70 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{subject}</p>
        </div>
      </header>

      <div className="px-4 py-3 flex items-center justify-between text-xs shrink-0 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
        <span className="font-bold text-base text-slate-800 dark:text-slate-100">
          {index} <span className="font-normal text-xs text-slate-500 dark:text-slate-400">de {total}</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 bg-white dark:bg-slate-900">
        <p className="text-base leading-relaxed mb-6 font-medium text-slate-800 dark:text-slate-100">
          {question.enunciado}
        </p>

        <div className="flex flex-col gap-3">
          {Object.entries(question.alternativas).map(([letra, texto]) => {
            const opt = { id: letra, text: texto };
            const state = getOptionState(opt.id);
            const isEliminated = eliminated.includes(opt.id);

            let cardClasses = "w-full text-left bg-white border-b border-slate-200 p-4 hover:bg-slate-50 transition-colors grid grid-cols-[auto_1fr] gap-4 items-center relative ";
            let badgeClasses = "w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors ";
            let textClasses = "text-base text-slate-700 leading-relaxed ";

            if (state === 'selected') {
              cardClasses += "border-[var(--color-primary)] bg-[var(--color-primary)]/10";
              badgeClasses += "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10";
              textClasses += "font-medium text-slate-900 dark:text-slate-100";
            } else if (state === 'correct') {
              cardClasses += "border-green-500 bg-green-50 dark:bg-green-900/20";
              badgeClasses += "bg-green-500 border-green-500 text-white";
              textClasses += "font-medium text-slate-900 dark:text-slate-100";
            } else if (state === 'incorrect') {
              cardClasses += "border-red-500 bg-red-50 dark:bg-red-900/20";
              badgeClasses += "bg-red-500 border-red-500 text-white";
              textClasses += "font-medium text-slate-900 dark:text-slate-100";
            } else {
              cardClasses += "bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800";
              badgeClasses += "border-slate-300 text-slate-500 bg-white dark:bg-slate-900";
              textClasses += "text-slate-700 dark:text-slate-200";
            }

            if (isEliminated) {
              cardClasses += " opacity-50 grayscale";
              textClasses += " line-through text-slate-400 dark:text-slate-500";
            }

            return (
              <button
                key={opt.id}
                onClick={() => { if (!justSwiped) handleSelect(opt.id); }}
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, opt.id)}
                disabled={answered}
                className={cardClasses}
              >
                <div className={badgeClasses}>
                  {opt.id}
                </div>
                <div className={textClasses}>
                  {opt.text}
                </div>
              </button>
            );
          })}
        </div>
        
        <div ref={actionAreaRef} className="mt-4 pb-4">
          {!answered && (
            <button
              onClick={handleSubmit}
              disabled={!selected}
              className="w-full mt-6 py-4 rounded-xl font-bold text-base transition-all duration-200 bg-[var(--color-primary)] hover:opacity-90 text-white shadow-lg disabled:opacity-50"
            >
              CONFIRMAR
            </button>
          )}

          {answered && (
            <div className="mt-2 w-full animate-in fade-in duration-300 pb-4">
              <div className="flex items-center gap-2 text-[var(--color-primary)] font-bold mb-3">
                🎓 Mentor AIVUR
              </div>
              <div className="p-4 bg-[var(--color-primary)]/5 dark:bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 dark:border-[var(--color-primary)]/30 rounded-xl text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {question.justificativa || (selected === question.correta ? "Resposta correta!" : `Resposta incorreta. Gabarito: ${question.correta}.`)}
              </div>
              
              <button
                onClick={onNext}
                disabled={index === total}
                className="w-full mt-6 py-4 rounded-xl font-bold text-base transition-all duration-200 bg-[var(--color-primary)] hover:opacity-90 text-white shadow-lg disabled:opacity-50"
              >
                {index < total ? 'PRÓXIMA' : 'FINALIZAR'}
              </button>
            </div>
          )}
        </div>
        
        {/* Spacer for bottom bar */}
        <div className="h-24"></div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <button
          onClick={onPrev}
          disabled={index === 1}
          className="p-2 rounded-full disabled:opacity-30 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <ChevronLeft size={28} />
        </button>

        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Navegação</span>

        <button
          onClick={onNext}
          disabled={index === total}
          className="p-2 rounded-full disabled:opacity-30 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <ChevronRight size={28} />
        </button>
      </div>
    </div>
  );
}