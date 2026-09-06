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
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] shadow-sm transition-all duration-200">
      {/* ── Header ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left bg-[#0A2E45] border-none p-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 hover:bg-[#0c3651] transition-colors"
        aria-expanded={open}
      >
        <div className="flex w-full items-center justify-between px-6 py-5 gap-4">
          
          {/* Left: title + fraction */}
          <div className="flex flex-col gap-1 text-left flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[#FBEBD0] m-0 leading-tight truncate">
              {title}
            </h3>
            <p className="text-sm text-[#6B99B3] m-0 leading-tight">
              {done}/{topics.length} tópicos
            </p>
          </div>

          {/* Right: percent + progress bar + chevron */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <div className="flex flex-col items-end gap-2">
              <span className="text-[13px] font-bold tabular-nums text-emerald-400 leading-none">
                {pct}%
              </span>
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <ChevronDown
              size={20}
              className="text-[#6B99B3] flex-shrink-0 transition-transform duration-200"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>
        </div>
      </button>

      {/* ── Topics list com Botões de Ação ── */}
      {open && (
        <ul className="m-0 px-6 pb-4 list-none divide-y divide-white/5 border-t border-white/10 bg-[#0A2E45]">
          {topics.map((topic) => {
            const youtubeQuery = encodeURIComponent(`${topic.label} ${title} para concursos aula`);

            return (
              <li key={topic.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4">
                
                {/* Tópico (Esquerda) */}
                <div className="flex items-start gap-3 flex-1 min-w-0 lg:pr-6">
                  <div className="pt-0.5 flex-shrink-0">
                    {topic.done ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <Circle size={18} className="text-[#6B99B3]/50" />
                    )}
                  </div>
                  <span
                    className={`text-[15px] leading-snug break-words ${
                      topic.done 
                        ? "text-[#6B99B3] line-through" 
                        : "text-[#DCE8ED] font-medium"
                    }`}
                  >
                    {topic.label}
                  </span>
                </div>

                {/* Botões de Ação / Micro-estudo (Direita - Grade fixa) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-7 lg:pl-0 flex-shrink-0 lg:w-[440px]">
                  {/* YouTube Shortcut */}
                  <a
                    href={`https://www.youtube.com/results?search_query=${youtubeQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full justify-center items-center gap-1.5 px-2 py-1.5 rounded border border-red-900/30 bg-red-900/10 hover:bg-red-900/20 text-red-400 transition-colors"
                    title="Pesquisar aula no YouTube"
                    style={{ textDecoration: "none" }}
                  >
                    <Play size={14} className="flex-shrink-0" />
                    <span className="text-[11px] font-bold tracking-wide">Aula</span>
                  </a>

                  {/* Resumo + Dicas */}
                  <Link
                    href={`/sala-de-aula?topic=${topic.id}&discipline=${encodeURIComponent(title)}&tab=resumo`}
                    className="inline-flex w-full justify-center items-center gap-1.5 px-2 py-1.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-[#DCE8ED] transition-colors cursor-pointer"
                    style={{ textDecoration: "none" }}
                  >
                    <FileText size={14} className="flex-shrink-0" />
                    <span className="text-[11px] font-bold tracking-wide">Resumo</span>
                  </Link>

                  {/* Questões */}
                  <Link
                    href={`/sala-de-aula?topic=${topic.id}&discipline=${encodeURIComponent(title)}&tab=questoes`}
                    className="inline-flex w-full justify-center items-center gap-1.5 px-2 py-1.5 rounded border border-blue-900/30 bg-blue-900/10 hover:bg-blue-900/20 text-blue-400 transition-colors"
                    style={{ textDecoration: "none" }}
                  >
                    <Target size={14} className="flex-shrink-0" />
                    <span className="text-[11px] font-bold tracking-wide">Questões</span>
                  </Link>

                  {/* Flashcards */}
                  <Link
                    href={`/sala-de-aula?topic=${topic.id}&discipline=${encodeURIComponent(title)}&tab=flashcards`}
                    className="inline-flex w-full justify-center items-center gap-1.5 px-2 py-1.5 rounded border border-amber-900/30 bg-amber-900/10 hover:bg-amber-900/20 text-amber-400 transition-colors cursor-pointer"
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
