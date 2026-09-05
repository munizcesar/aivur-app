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
  const pct =
    progressPercent ??
    (topics.length > 0 ? Math.round((done / topics.length) * 100) : 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* ── Header ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        aria-expanded={open}
      >
        {/* Envolver o flex em uma div resolve bugs de layout dentro de <button> */}
        <div className="flex w-full items-center justify-between px-6 py-5 gap-4">
          
          {/* Left: title + fraction */}
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-slate-800 m-0 leading-tight">
              {title}
            </h3>
            <p className="text-sm text-slate-500 m-0 leading-tight">
              {done}/{topics.length} tópicos
            </p>
          </div>

          {/* Right: percent + progress bar + chevron */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-sm font-bold tabular-nums text-emerald-600 leading-none">
                {pct}%
              </span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <ChevronDown
              size={20}
              className="text-slate-400 transition-transform duration-200 flex-shrink-0"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>
        </div>
      </button>

      {/* ── Topics list ── */}
      {open && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100 px-6">
          {topics.map((topic) => (
            <li key={topic.id} className="flex items-center gap-3 py-3 text-sm">
              {/* O `size={18}` trava a dimensão real do SVG contra conflitos globais de CSS */}
              {topic.done ? (
                <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-500" />
              ) : (
                <Circle size={18} className="flex-shrink-0 text-slate-300" />
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
