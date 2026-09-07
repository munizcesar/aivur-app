"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle, Play, FileText, Target } from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";

export interface TrilhasAccordionTopic {
  id: string;
  label?: string;
  name?: string;
  done?: boolean;
}

export interface TrilhasAccordionProps {
  title?: string;
  topics?: TrilhasAccordionTopic[];
  discipline?: {
    id?: string;
    title?: string;
    name?: string;
    topics: TrilhasAccordionTopic[];
  };
  progressPercent?: number;
  defaultOpen?: boolean;
}

export default function TrilhasAccordion(props: TrilhasAccordionProps) {
  const [open, setOpen] = useState(props.defaultOpen ?? false);
  const setCurrentTopic = useStudyStore((state) => state.setCurrentTopic);
  const setActiveTab = useStudyStore((state) => state.setActiveTab);
  const completedTopicIds = useStudyStore((state) => state.completedTopicIds);

  const title =
    props.title ??
    props.discipline?.title ??
    props.discipline?.name ??
    "Disciplina";
  const rawTopics = props.topics ?? props.discipline?.topics ?? [];

  const discipline = {
    title,
    topics: rawTopics.map((t) => ({
      ...t,
      name: t.name ?? t.label ?? "",
    })),
  };

  const realDone = discipline.topics.filter((t) => completedTopicIds.includes(t.id)).length;
  const pct =
    discipline.topics.length > 0
      ? Math.round((realDone / discipline.topics.length) * 100)
      : 0;

  return (
    <div className="w-full">
      {/* ── Cabeçalho da Matéria (Botão Principal) ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex justify-between items-center p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors mb-2 text-slate-800"
        aria-expanded={open}
      >
        <div className="flex flex-col text-left flex-1 min-w-0 pr-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sm truncate">
              {discipline.title}
            </span>
            <span className="text-xs font-bold tabular-nums text-emerald-600 shrink-0">
              {pct}%
            </span>
          </div>
          {/* Barra de Progresso */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 flex-none text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* ── Subtópico Expandido (Proteção contra Overflow) ── */}
      {open && (
        <div className="flex flex-col bg-slate-50 border-x border-b border-slate-200 rounded-b-lg mb-4 text-sm text-slate-700">
          {discipline.topics.map((topic, idx) => (
            <div 
              key={idx} 
              className="flex flex-col md:flex-row md:items-center gap-4 w-full border-b border-slate-700/50 py-4 px-4 hover:bg-slate-100/50 cursor-pointer transition-colors last:border-0"
              onClick={() => setCurrentTopic(topic.id)}
            >
              {/* Título do Tópico com Ícone Defensivo */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-none shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-slate-100">
                  <CheckCircle 
                    size={24}
                    className={`shrink-0 flex-none transition-colors ${
                      completedTopicIds.includes(topic.id) ? "text-emerald-500" : "text-slate-400"
                    }`}
                  />
                </div>
                <span className="font-medium leading-snug line-clamp-2 min-w-0 flex-1">{topic.name}</span>
              </div>
              
              {/* Pílulas de Ação com Flex-Wrap Defensivo */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-3 md:mt-0 shrink-0">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTopic(topic.id);
                    setActiveTab("video");
                  }}
                  className="shrink-0 w-auto flex-none flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm text-xs font-medium text-slate-600 hover:-translate-y-0.5 hover:shadow hover:text-indigo-600 hover:border-indigo-200 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Play size={16} className="shrink-0 flex-none"/> Aula
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTopic(topic.id);
                    setActiveTab("resumo");
                  }}
                  className="shrink-0 w-auto flex-none flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm text-xs font-medium text-slate-600 hover:-translate-y-0.5 hover:shadow hover:text-indigo-600 hover:border-indigo-200 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <FileText size={16} className="shrink-0 flex-none"/> Resumo
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTopic(topic.id);
                    setActiveTab("questoes");
                  }}
                  className="shrink-0 w-auto flex-none flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm text-xs font-medium text-slate-600 hover:-translate-y-0.5 hover:shadow hover:text-indigo-600 hover:border-indigo-200 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Target size={16} className="shrink-0 flex-none"/> Questões
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
