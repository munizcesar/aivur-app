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

  function optionStyle(state: string) {
    switch (state) {
      case "selected":
        return {
          borderColor: "var(--color-primary)",
          backgroundColor: "rgba(196, 18, 48, 0.05)",
          color: "var(--color-text)",
        };
      case "correct":
        return {
          borderColor: "var(--color-success)",
          backgroundColor: "rgba(42, 90, 67, 0.1)",
          color: "var(--color-text)",
        };
      case "incorrect":
        return {
          borderColor: "var(--color-error)",
          backgroundColor: "rgba(196, 18, 48, 0.1)",
          color: "var(--color-text)",
        };
      case "disabled":
        return {
          borderColor: "var(--color-border)",
          backgroundColor: "transparent",
          color: "var(--color-text-muted)",
          opacity: 0.6,
        };
      default:
        return {
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
        };
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] w-screen h-screen flex flex-col bg-slate-900 overflow-y-auto m-0 p-0">
      <header
        className="flex items-center gap-3 px-4 py-4 shrink-0 shadow-sm"
        style={{ backgroundColor: "var(--color-primary)", color: "#FFFFFF" }}
      >
        <button onClick={onBack} aria-label="Voltar" className="p-1 rounded-full active:opacity-70">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{subject}</p>
        </div>
      </header>

      <div
        className="px-4 py-3 flex items-center justify-between text-xs shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-muted)", backgroundColor: "var(--color-surface)" }}
      >
        <span className="font-bold text-base" style={{ color: "var(--color-text)" }}>
          {index} <span className="font-normal text-xs">de {total}</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5" style={{ backgroundColor: "var(--color-bg)" }}>
        <p className="text-base leading-relaxed mb-6 font-medium" style={{ color: "var(--color-text)" }}>
          {question.enunciado}
        </p>

        <div className="flex flex-col gap-3">
          {Object.entries(question.alternativas).map(([letra, texto]) => {
            const state = getOptionState(letra);
            
            let labelBg = "var(--color-surface-offset)";
            let labelColor = "var(--color-text-muted)";
            
            if (state === "selected") {
              labelBg = "var(--color-primary)";
              labelColor = "#FFFFFF";
            } else if (state === "correct") {
              labelBg = "var(--color-success)";
              labelColor = "#FFFFFF";
            } else if (state === "incorrect") {
              labelBg = "var(--color-error)";
              labelColor = "#FFFFFF";
            }

            return (
              <button
                key={letra}
                onClick={() => handleSelect(letra)}
                disabled={answered}
                className="flex items-start gap-3 text-left rounded-xl p-4 transition-colors border"
                style={optionStyle(state)}
              >
                <span
                  className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full text-sm font-bold mt-0.5"
                  style={{ backgroundColor: labelBg, color: labelColor }}
                >
                  {letra}
                </span>
                <span className="text-sm mt-1 flex-1 leading-relaxed">{texto}</span>
              </button>
            );
          })}
        </div>
        
        {answered && (
          <div className="mt-6 p-4 rounded-xl shadow-sm" style={{ backgroundColor: "var(--color-surface)", borderLeft: selected === question.correta ? "4px solid var(--color-success)" : "4px solid var(--color-error)" }}>
            <p className="font-bold mb-2 text-sm" style={{ color: selected === question.correta ? "var(--color-success)" : "var(--color-error)" }}>
              {selected === question.correta ? "✅ Você acertou!" : "❌ Você errou!"}
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {question.justificativa}
            </p>
          </div>
        )}
        
        {/* Spacer for bottom bar */}
        <div className="h-24"></div>
      </div>

      <div
        className="px-4 py-4 shrink-0 shadow-lg flex items-center justify-between"
        style={{ borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}
      >
        <button
          onClick={onPrev}
          disabled={index === 1}
          className="p-2 rounded-full disabled:opacity-30"
          style={{ color: "var(--color-text)" }}
        >
          <ChevronLeft size={28} />
        </button>

        {!answered ? (
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className="px-8 py-3 rounded-full font-bold shadow-md transition-all disabled:opacity-50"
            style={{
              backgroundColor: selected ? "var(--color-primary)" : "var(--color-surface-offset)",
              color: selected ? "#FFFFFF" : "var(--color-text-muted)",
            }}
          >
            CONFIRMAR
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={index === total}
            className="px-8 py-3 rounded-full font-bold shadow-md transition-all disabled:opacity-50"
            style={{
              backgroundColor: index < total ? "var(--color-primary)" : "var(--color-surface-offset)",
              color: index < total ? "#FFFFFF" : "var(--color-text-muted)",
            }}
          >
            {index < total ? "PRÓXIMA" : "FINALIZAR"}
          </button>
        )}

        <button
          onClick={onNext}
          disabled={index === total}
          className="p-2 rounded-full disabled:opacity-30"
          style={{ color: "var(--color-text)" }}
        >
          <ChevronRight size={28} />
        </button>
      </div>
    </div>,
    document.body
  );
}