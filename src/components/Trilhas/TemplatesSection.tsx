"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Layers, 
  Clock, 
  Award, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Compass,
  Filter
} from "lucide-react";
import { COURSE_TEMPLATES, type CourseTemplate } from "@/data/courses/templates";

interface TemplatesSectionProps {
  onSelectTemplate?: (template: CourseTemplate) => void;
  isLoadingTemplate?: string | null;
}

export default function TemplatesSection({ onSelectTemplate, isLoadingTemplate }: TemplatesSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  const categories = [
    "Todos",
    "Segurança Pública",
    "Administrativo",
    "Tribunais",
    "Fiscal & Bancário",
  ];

  const filteredTemplates = selectedCategory === "Todos"
    ? COURSE_TEMPLATES
    : COURSE_TEMPLATES.filter((t) => t.category === selectedCategory);

  return (
    <section className="mt-12 pt-8 border-t border-[rgba(107,153,179,0.2)]" aria-labelledby="templates-heading">
      {/* HEADER DA SEÇÃO DE TEMPLATES */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#F4A261]/10 text-[#F4A261] text-xs font-bold uppercase tracking-wider mb-2">
            <Compass className="w-3.5 h-3.5" />
            Modelos Estruturados
          </div>
          <h2 id="templates-heading" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Cursos pré-configurados
          </h2>
          <p className="text-sm text-[#6B99B3] mt-1 max-w-2xl">
            Inicie com editais oficiais pré-mapeados e checklists prontos para estudo imediato sem precisar de digitação.
          </p>
        </div>

        {/* CONTADOR */}
        <div className="text-xs text-[#6B99B3] flex items-center gap-2">
          <span>Exibindo <strong>{filteredTemplates.length}</strong> de {COURSE_TEMPLATES.length} modelos</span>
        </div>
      </div>

      {/* FILTROS POR CATEGORIA (PILLS) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none" role="tablist">
        <span className="text-xs text-[#6B99B3] font-semibold flex items-center gap-1 pl-1 pr-1 flex-shrink-0">
          <Filter className="w-3.5 h-3.5" /> Área:
        </span>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex-shrink-0 cursor-pointer ${
                isActive
                  ? "bg-[#C41230] text-[#FBEBD0] shadow-[2px_2px_0px_#6B0000]"
                  : "bg-[#0A2E45]/40 hover:bg-[#0A2E45] text-[#6B99B3] hover:text-[#FBEBD0] border border-[rgba(107,153,179,0.2)]"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* GRID DE CARDS MODULARES DE TEMPLATES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((template) => {
          return (
            <div
              key={template.id}
              className="flex flex-col justify-between rounded-xl border border-[rgba(107,153,179,0.2)] hover:border-[rgba(107,153,179,0.45)] bg-[#0A2E45]/25 hover:bg-[#0A2E45]/40 p-5 transition-all duration-200 hover:-translate-y-1 shadow-sm backdrop-blur-sm group"
            >
              <div>
                {/* TOPO: BADGE & CATEGORIA */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B99B3]">
                    {template.category}
                  </span>
                  {template.badge && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-[#C41230]/15 text-[#F4A261] border border-[#C41230]/30">
                      {template.badge}
                    </span>
                  )}
                </div>

                {/* TÍTULO E BANCA */}
                <h3 className="text-lg font-bold text-white group-hover:text-[#FBEBD0] transition-colors leading-snug">
                  {template.title}
                </h3>
                {template.banca && (
                  <p className="text-xs text-[#F4A261] font-semibold mt-1">
                    Banca alvo: {template.banca}
                  </p>
                )}

                {/* DESCRIÇÃO */}
                <p className="text-xs text-[#6B99B3] mt-2 line-clamp-3 leading-relaxed">
                  {template.description}
                </p>

                {/* CHIPS DE MATÉRIAS RESUMIDAS */}
                {template.syllabusSummary && template.syllabusSummary.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {template.syllabusSummary.slice(0, 3).map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#020C14]/60 text-slate-300 border border-[rgba(107,153,179,0.15)]"
                      >
                        {item}
                      </span>
                    ))}
                    {template.syllabusSummary.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-[#6B99B3]">
                        +{template.syllabusSummary.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* RODAPÉ DO CARD: MÉTRICAS E BOTÃO */}
              <div className="mt-5 pt-4 border-t border-[rgba(107,153,179,0.15)]">
                <div className="flex items-center justify-between text-xs text-[#6B99B3] mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#6B99B3]" />
                    {template.subjectsCount} matérias
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#6B99B3]" />
                    {template.topicsCount} tópicos
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#6B99B3]" />
                    ~{template.estimatedHours}h
                  </span>
                </div>

                {template.isReady ? (
                  <button
                    type="button"
                    onClick={() => onSelectTemplate?.(template)}
                    disabled={isLoadingTemplate === template.id}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#C41230] hover:bg-[#6B0000] disabled:opacity-50 disabled:cursor-not-allowed text-[#FBEBD0] text-xs sm:text-sm font-bold shadow-[2px_2px_0px_#6B0000] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                  >
                    {isLoadingTemplate === template.id ? (
                      <span className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-t-[#FBEBD0] border-[rgba(251,235,208,0.3)] rounded-full animate-spin" />
                        Acessando...
                      </span>
                    ) : (
                      <>
                        <span>Acessar Trilha</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectTemplate?.(template)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[rgba(107,153,179,0.3)] bg-[#020C14]/50 hover:bg-[#0A2E45] text-[#FBEBD0] hover:border-[#F4A261] text-xs sm:text-sm font-bold transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#F4A261]" />
                    <span>Usar como Base</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

