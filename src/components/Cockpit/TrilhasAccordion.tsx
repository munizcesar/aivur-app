"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  CheckCircle2,
  Circle,
  Play,
  FileText,
  Target,
  BookOpen,
  Calculator,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";

// ── Mapeamento local de ícone/cor por disciplina ───────────────────────────
// Fica aqui (Client Component) — não pode serializar funções via props de Server.
// Cores WCAG AA verificadas sobre #0B1929 (≥ 4.5:1).
const DISC_META: Array<{ icon: LucideIcon; color: string }> = [
  { icon: BookOpen,    color: "#60A5FA" }, // blue-400   — Língua Portuguesa
  { icon: Calculator,  color: "#A78BFA" }, // violet-400 — Matemática
  { icon: Scale,       color: "#FBBF24" }, // amber-400  — Legislação
  { icon: ShieldCheck, color: "#34D399" }, // emerald-400 — Conhecimentos Específicos
];

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
  /** Índice da disciplina no catálogo (0-based) — serializable, resolve o ícone localmente */
  disciplineIndex?: number;
  moduleId: string; // Adicionado para identificar a disciplina no store global
}

export default function TrilhasAccordion(props: TrilhasAccordionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(props.defaultOpen ?? false);
  const selectTopic = useStudyStore((state) => state.selectTopic);
  const setActiveTab = useStudyStore((state) => state.setActiveTab);
  const completedTopicIds = useStudyStore((state) => state.completedTopicIds);
  const toggleTopicCompletion = useStudyStore((state) => state.toggleTopicCompletion);

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

  const realDone = discipline.topics.filter((t) =>
    completedTopicIds.includes(t.id)
  ).length;
  const pct =
    discipline.topics.length > 0
      ? Math.round((realDone / discipline.topics.length) * 100)
      : 0;

  const Icon: LucideIcon = DISC_META[props.disciplineIndex ?? 0]?.icon ?? BookOpen;
  const iconColor = DISC_META[props.disciplineIndex ?? 0]?.color ?? "#94A3B8";
  const iconBg = `${iconColor}1F`;

  return (
    <div className="w-full overflow-hidden">

      {/* ── Card Header (accordion trigger) ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex justify-between items-center px-4 py-4 rounded-xl transition-all duration-200 active:scale-[0.99] cursor-pointer relative z-10 group"
        style={{
          backgroundColor: "#0B1929",
          border: "1px solid #1E3A5F",
          borderLeft: "4px solid #C9A84C",
        }}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">

          {/* Discipline icon with tinted bg */}
          <div
            className="shrink-0 flex-none rounded-lg flex items-center justify-center"
            style={{ backgroundColor: iconBg, width: "40px", height: "40px", minWidth: "40px" }}
          >
            <Icon size={20} className="shrink-0 flex-none" style={{ color: iconColor }} />
          </div>

          {/* Title + subtext + progress */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-semibold text-sm text-[#FBEBD0] truncate">
                {discipline.title}
              </span>
              <span className="shrink-0 rounded bg-[#122338] px-2 py-1 text-xs font-bold tabular-nums text-[#C9A84C]">
                {pct}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2 leading-none">
              {realDone} de {discipline.topics.length} tópicos concluídos
            </p>
            {/* Progress bar */}
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#1E3A5F" }}>
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <ChevronDown
          size={18}
          className={`shrink-0 flex-none text-slate-500 group-hover:text-slate-300 transition-all duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* ── Topics list (expandido) ── */}
      {open && (
        <div
          className="flex flex-col rounded-b-xl overflow-hidden mb-1"
          style={{
            borderLeft: "4px solid #C9A84C",
            borderRight: "1px solid #1E3A5F",
            borderBottom: "1px solid #1E3A5F",
          }}
        >
          {discipline.topics.map((topic, idx) => {
            const isDone = completedTopicIds.includes(topic.id);
            return (
              <div
                key={idx}
                className="flex flex-col md:flex-row md:items-center gap-3 w-full border-b py-3.5 px-4 cursor-pointer transition-colors last:border-0"
                style={{
                  backgroundColor: "#0B1929",
                  borderColor: "rgba(30, 58, 95, 0.6)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = "#0F2235";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = "#0B1929";
                }}
                onClick={() => {
                  selectTopic(props.moduleId, topic.id);
                  setActiveTab("video");
                  router.push("/sala-de-aula");
                }}
              >
                {/* Status icon + topic name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isDone ? (
                    <button
                      type="button"
                      aria-label={`Desmarcar ${topic.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTopicCompletion(topic.id);
                      }}
                      className="shrink-0 rounded-full text-emerald-400 transition-transform hover:scale-110"
                    >
                      <CheckCircle2 size={18} className="shrink-0 flex-none" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Marcar ${topic.name} como concluído`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTopicCompletion(topic.id);
                      }}
                      className="shrink-0 rounded-full text-slate-600 transition-colors hover:text-emerald-400"
                    >
                      <Circle size={18} className="shrink-0 flex-none" />
                    </button>
                  )}
                  <span
                    className={`text-sm leading-snug line-clamp-2 min-w-0 flex-1 ${
                      isDone ? "text-slate-500 line-through" : "text-slate-200"
                    }`}
                  >
                    {topic.name}
                  </span>
                </div>

                {/* ── Action pills ── */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">

                  {/* Aula — azul */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selectTopic(props.moduleId, topic.id);
                      setActiveTab("video");
                      router.push("/sala-de-aula");
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all duration-200 active:scale-95 cursor-pointer relative z-10 shrink-0 flex-none"
                    style={{
                      backgroundColor: "rgba(30, 58, 138, 0.45)",
                      color: "#93C5FD",
                      borderColor: "rgba(59, 130, 246, 0.35)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(30, 58, 138, 0.7)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(30, 58, 138, 0.45)";
                    }}
                  >
                    <Play size={12} className="shrink-0 flex-none" />
                    Aula
                  </button>

                  {/* Resumo — índigo */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selectTopic(props.moduleId, topic.id);
                      setActiveTab("resumo");
                      router.push("/sala-de-aula");
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all duration-200 active:scale-95 cursor-pointer relative z-10 shrink-0 flex-none"
                    style={{
                      backgroundColor: "rgba(49, 46, 129, 0.45)",
                      color: "#A5B4FC",
                      borderColor: "rgba(99, 102, 241, 0.35)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(49, 46, 129, 0.7)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(49, 46, 129, 0.45)";
                    }}
                  >
                    <FileText size={12} className="shrink-0 flex-none" />
                    Resumo
                  </button>

                  {/* Questões — âmbar */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selectTopic(props.moduleId, topic.id);
                      setActiveTab("questoes");
                      router.push("/sala-de-aula");
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all duration-200 active:scale-95 cursor-pointer relative z-10 shrink-0 flex-none"
                    style={{
                      backgroundColor: "rgba(120, 53, 15, 0.45)",
                      color: "#FCD34D",
                      borderColor: "rgba(217, 119, 6, 0.35)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(120, 53, 15, 0.7)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(120, 53, 15, 0.45)";
                    }}
                  >
                    <Target size={12} className="shrink-0 flex-none" />
                    Questões
                  </button>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
