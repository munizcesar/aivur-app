"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, Circle } from "lucide-react";

interface TrilhasAccordionTopic {
  id: string;
  label: string;
  done?: boolean;
}

interface TrilhasAccordionProps {
  title: string;
  topics: TrilhasAccordionTopic[];
  progressPercent?: number;
}

export default function TrilhasAccordion({
  title,
  topics,
  progressPercent,
}: TrilhasAccordionProps) {
  const [open, setOpen] = useState(false);

  const done = topics.filter((t) => t.done).length;
  const pct = progressPercent ?? (topics.length > 0 ? Math.round((done / topics.length) * 100) : 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        aria-expanded={open}
      >
        {/* Progress ring placeholder */}
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold tabular-nums"
          style={{
            borderColor: pct === 100 ? "#10b981" : "#e2e8f0",
            color: pct === 100 ? "#10b981" : "#64748b",
            backgroundColor: pct === 100 ? "#ecfdf5" : "#f8fafc",
          }}
        >
          {pct}%
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-slate-800">{title}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {done}/{topics.length} tópicos concluídos
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <ChevronDown
          className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Topics list */}
      {open && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100 px-5">
          {topics.map((topic) => (
            <li
              key={topic.id}
              className="flex items-center gap-3 py-3 text-sm"
            >
              {topic.done ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 flex-shrink-0 text-slate-300" />
              )}
              <span
                className={
                  topic.done ? "text-slate-400 line-through" : "text-slate-700"
                }
              >
                {topic.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
