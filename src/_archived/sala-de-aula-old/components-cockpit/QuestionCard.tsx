"use client";

import type { Question } from "@/mocks/cockpitQuestionsMock";

interface QuestionCardProps {
  question: Question;
  index: number;
  selected: string | null;
  answered: boolean;
  onSelect: (optionId: string) => void;
  onConfirm: () => void;
}

export default function QuestionCard({
  question,
  index,
  selected,
  answered,
  onSelect,
  onConfirm,
}: QuestionCardProps) {
  const isTrueFalse = question.format === "true_false";

  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-xs text-[#9bb3c0]">
        <span className="font-bold text-[#fbead0]">Q{index + 1}</span>
        <span>
          {isTrueFalse ? "Certo/Errado" : "Múltipla Escolha"} ·{" "}
          {answered ? "Respondida" : "Pendente"}
        </span>
      </div>
      <div className="p-4 md:p-6">
        <p className="text-base font-semibold leading-relaxed text-[#fbead0] md:text-lg">{question.enunciado}</p>
        <div className="mt-5 flex flex-col gap-3">
          {question.alternativas.map((option) => {
            const isSelected = selected === option.id;
            const isCorrect = answered && option.id === question.correta;
            const isWrong = answered && isSelected && !isCorrect;
            const isInactive = answered && !isCorrect && !isWrong;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.id)}
                disabled={answered}
                className={`w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all duration-200 ease-in-out active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/50 disabled:cursor-default ${
                  isCorrect
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : isWrong
                      ? "border-rose-500 bg-rose-50 text-rose-900"
                      : isInactive
                        ? "border-slate-200 bg-white text-slate-600 opacity-60"
                        : isSelected
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-md ring-1 ring-[var(--color-primary)]/50"
                          : "hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                }`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px minmax(0, 1fr)",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px 20px",
                  minHeight: "72px",
                  boxSizing: "border-box",
                  backgroundColor: isCorrect
                    ? "#ecfdf5"
                    : isWrong
                      ? "#fff1f2"
                      : isInactive
                        ? "#ffffff"
                        : isSelected
                          ? "color-mix(in srgb, var(--color-primary) 5%, white)"
                          : "#ffffff",
                  borderColor: isCorrect
                    ? "#10b981"
                    : isWrong
                      ? "#f43f5e"
                      : isInactive
                        ? "#e2e8f0"
                        : undefined,
                  color: isCorrect ? "#064e3b" : isWrong ? "#881337" : isInactive ? "#475569" : "#1e293b",
                  opacity: isInactive ? 0.6 : 1,
                }}
              >
                <span
                  className={`flex items-center justify-center rounded-full border-2 font-bold transition-transform duration-200 ease-in-out ${
                    isTrueFalse ? "text-xs" : "text-sm"
                  } ${isSelected ? "scale-105" : ""}`}
                  style={{
                    width: "40px",
                    height: "40px",
                    minWidth: "40px",
                    minHeight: "40px",
                    color: isCorrect || isWrong ? "#ffffff" : isInactive ? "#475569" : "#334155",
                    backgroundColor: isCorrect ? "#10b981" : isWrong ? "#f43f5e" : isSelected ? "#e2e8f0" : "#ffffff",
                    borderColor: isCorrect ? "#10b981" : isWrong ? "#f43f5e" : isSelected ? "var(--color-primary)" : "#cbd5e1",
                    transform: isSelected ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  {option.id}
                </span>
                <span
                  className="text-base font-medium leading-relaxed text-slate-800"
                  style={{
                    color: isCorrect ? "#064e3b" : isWrong ? "#881337" : isInactive ? "#475569" : "#1e293b",
                    minWidth: 0,
                  }}
                >
                  {option.texto}
                </span>
              </button>
            );
          })}
        </div>
        {answered && (
          <div
            className={`mt-6 rounded-xl border p-4 opacity-100 transition-opacity duration-300 ease-in-out ${
              selected === question.correta
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-slate-200 bg-slate-100 text-slate-800"
            }`}
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-bold">
              {selected === question.correta ? "Resposta correta!" : "Resposta incorreta"}
            </p>
            <p className="mt-2 text-sm leading-relaxed">{question.explicacao}</p>
          </div>
        )}
        <button
          type="button"
          onClick={onConfirm}
          disabled={!selected || answered}
          className="mt-5 w-full rounded-lg px-4 py-3 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {answered ? `Resposta registrada · ${selected}` : "Responder"}
        </button>
      </div>
    </article>
  );
}
