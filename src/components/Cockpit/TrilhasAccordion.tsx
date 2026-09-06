"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, CheckCircle2, Circle, Play, FileText, Target, Layers } from "lucide-react";

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
    <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F3A53] shadow-sm transition-all duration-200">
      {/* ── Header ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left bg-transparent border-none p-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        aria-expanded={open}
      >
        <div className="flex w-full items-center justify-between px-6 py-4 gap-4">
          
          {/* Left: title + fraction */}
          <div className="flex flex-col gap-1 text-left">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 m-0 leading-tight">
              {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 m-0 leading-tight">
              {done}/{topics.length} tópicos
            </p>
          </div>

          {/* Right: percent + progress bar + chevron */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400 leading-none">
                {pct}%
              </span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <ChevronDown
              size={20}
              className="text-slate-400 dark:text-slate-500 flex-shrink-0 transition-transform duration-200"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>
        </div>
      </button>

      {/* ── Topics list com Botões de Ação ── */}
      {open && (
        <ul className="m-0 px-6 pb-2 list-none divide-y divide-slate-100 dark:divide-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          {topics.map((topic) => {
            const youtubeQuery = encodeURIComponent(`${topic.label} ${title} para concursos aula`);

            return (
              <li key={topic.id} className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 py-3.5">
                
                {/* Tópico (Esquerda) */}
                <div className="flex items-start gap-3">
                  <div className="pt-0.5 flex-shrink-0">
                    {topic.done ? (
                      <CheckCircle2 size={18} className="text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <Circle size={18} className="text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium leading-snug ${
                      topic.done 
                        ? "text-slate-400 dark:text-slate-500 line-through" 
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {topic.label}
                  </span>
                </div>

                {/* Botões de Ação / Micro-estudo (Direita) */}
                <div className="flex flex-wrap items-center gap-2 pl-7 xl:pl-0">
                  {/* YouTube Shortcut */}
                  <a
                    href={`https://www.youtube.com/results?search_query=${youtubeQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-red-100 dark:border-red-900/30 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                    title="Pesquisar aula no YouTube"
                    style={{ textDecoration: "none" }}
                  >
                    <Play size={14} className="flex-shrink-0" />
                    <span className="text-[11px] font-bold tracking-wide">Aula</span>
                  </a>

                  {/* Resumo + Dicas */}
                  <Link
                    href={`/sala-de-aula?topic=${topic.id}&discipline=${encodeURIComponent(title)}&tab=resumo`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    style={{ textDecoration: "none" }}
                  >
                    <FileText size={14} className="flex-shrink-0" />
                    <span className="text-[11px] font-bold tracking-wide">Resumo</span>
                  </Link>

                  {/* Questões */}
                  <Link
                    href={`/sala-de-aula?topic=${topic.id}&discipline=${encodeURIComponent(title)}&tab=questoes`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-blue-100 dark:border-blue-900/30 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                    style={{ textDecoration: "none" }}
                  >
                    <Target size={14} className="flex-shrink-0" />
                    <span className="text-[11px] font-bold tracking-wide">Questões</span>
                  </Link>

                  {/* Flashcards */}
                  <Link
                    href={`/sala-de-aula?topic=${topic.id}&discipline=${encodeURIComponent(title)}&tab=flashcards`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-amber-100 dark:border-amber-900/30 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/10 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                    style={{ textDecoration: "none" }}
                  >
                    <Layers size={14} className="flex-shrink-0" />
                    <span className="text-[11px] font-bold tracking-wide">Flashcards</span>
                  </Link>
                </div>
                
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
