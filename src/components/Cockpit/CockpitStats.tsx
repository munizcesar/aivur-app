"use client";

import { useStudyStore } from "@/store/useStudyStore";

export default function CockpitStats() {
  const { answered, correct, incorrect } = useStudyStore(
    (state) => state.progressData,
  );

  const accuracy =
    answered > 0 ? Math.round((correct / answered) * 100) : null;

  return (
    <div
      className="flex flex-wrap items-stretch gap-3"
      role="region"
      aria-label="Estatísticas da sessão"
    >
      {/* Acertos */}
      <div
        className="flex min-w-[90px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3"
        style={{ minHeight: "64px" }}
      >
        <span
          className="text-2xl font-semibold tabular-nums leading-none text-emerald-600"
          aria-label={`${correct} acertos`}
        >
          {correct}
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-emerald-500">
          Acertos
        </span>
      </div>

      {/* Erros */}
      <div
        className="flex min-w-[90px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3"
        style={{ minHeight: "64px" }}
      >
        <span
          className="text-2xl font-semibold tabular-nums leading-none text-rose-600"
          aria-label={`${incorrect} erros`}
        >
          {incorrect}
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-rose-400">
          Erros
        </span>
      </div>

      {/* Aproveitamento */}
      <div
        className="flex min-w-[90px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
        style={{ minHeight: "64px" }}
      >
        <span
          className="text-2xl font-semibold tabular-nums leading-none text-slate-700"
          aria-label={
            accuracy !== null ? `${accuracy}% de aproveitamento` : "Sem dados"
          }
        >
          {accuracy !== null ? `${accuracy}%` : "—"}
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Aproveit.
        </span>
      </div>

      {/* Total respondidas */}
      <div
        className="flex min-w-[90px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
        style={{ minHeight: "64px" }}
      >
        <span
          className="text-2xl font-semibold tabular-nums leading-none text-slate-700"
          aria-label={`${answered} questões respondidas`}
        >
          {answered}
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Respondidas
        </span>
      </div>
    </div>
  );
}
