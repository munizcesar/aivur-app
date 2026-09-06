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
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
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
              className="p-3 hover:bg-slate-100 border-b border-slate-200/60 last:border-0 cursor-pointer transition-colors"
              onClick={() => setCurrentTopic(topic.id)}
            >
              {/* Título do Tópico */}
              <div className="flex items-start gap-2 mb-2">
                <CheckCircle 
                  className={`w-4 h-4 shrink-0 mt-0.5 transition-colors ${
                    completedTopicIds.includes(topic.id) ? "text-emerald-500" : "text-slate-300"
                  }`}
                />
                <span className="font-medium leading-snug line-clamp-2">{topic.name}</span>
              </div>
              
              {/* Pílulas de Ação com Flex-Wrap (ESSENCIAL PARA NÃO VAZAR) */}
              <div className="flex flex-wrap gap-2 pl-6">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTopic(topic.id);
                    setActiveTab("video");
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded shadow-sm text-xs text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-colors"
                >
                  <Play className="w-3 h-3"/> Aula
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTopic(topic.id);
                    setActiveTab("resumo");
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded shadow-sm text-xs text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                >
                  <FileText className="w-3 h-3"/> Resumo
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTopic(topic.id);
                    setActiveTab("questoes");
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded shadow-sm text-xs text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                >
                  <Target className="w-3 h-3"/> Questões
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
