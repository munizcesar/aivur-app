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
    <section className="mt-16 pt-12 border-t border-[#0A2E45]/40" aria-labelledby="templates-heading">
      {/* HEADER DA SEÇÃO DE TEMPLATES */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A2E45]/40 border border-[#6B99B3]/20 text-[#6B99B3] text-[10px] font-bold uppercase tracking-widest mb-3 shadow-[0_0_10px_rgba(10,46,69,0.5)]">
            <Compass className="w-3.5 h-3.5 text-[#F4A261]" />
            Hub de Templates Premium
          </div>
          <h2 id="templates-heading" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Cursos pré-configurados
          </h2>
          <p className="text-sm text-[#6B99B3] mt-2 max-w-2xl font-medium">
            Inicie com editais oficiais pré-mapeados e checklists prontos para estudo imediato sem precisar de digitação.
          </p>
        </div>

        {/* CONTADOR */}
        <div className="text-xs font-semibold text-[#6B99B3] flex items-center gap-2 bg-[#0A2E45]/30 px-4 py-2 rounded-lg border border-[#0A2E45]">
          <span>Exibindo <strong>{filteredTemplates.length}</strong> de {COURSE_TEMPLATES.length} modelos</span>
        </div>
      </div>

      {/* FILTROS POR CATEGORIA (PILLS) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none" role="tablist">
        <span className="text-xs text-[#6B99B3] font-bold flex items-center gap-1.5 pl-1 pr-3 flex-shrink-0 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" /> Área
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex-shrink-0 cursor-pointer ${
                isActive
                  ? "bg-[#C41230] text-[#FBEBD0] shadow-[0_4px_14px_rgba(196,18,48,0.3)]"
                  : "bg-[#0A2E45]/40 hover:bg-[#0A2E45] text-[#6B99B3] hover:text-[#FBEBD0] border border-[#6B99B3]/10 hover:border-[#6B99B3]/30"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* GRID DE CARDS MODULARES DE TEMPLATES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          return (
            <div
              key={template.id}
              className="flex flex-col justify-between rounded-2xl border border-[#0A2E45]/50 hover:border-[#6B99B3]/40 bg-[#0A2E45]/20 p-6 transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(2,12,20,0.4)] hover:shadow-[0_12px_40px_rgba(2,12,20,0.6)] backdrop-blur-sm group"
            >
              <div>
                {/* TOPO: BADGE & CATEGORIA */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6B99B3]">
                    {template.category}
                  </span>
                  {template.badge && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#C41230]/20 text-[#F4A261] border border-[#C41230]/40 shadow-[0_0_10px_rgba(196,18,48,0.2)]">
                      {template.badge}
                    </span>
                  )}
                </div>

                {/* TÍTULO E BANCA */}
                <h3 className="text-xl font-bold text-white group-hover:text-[#FBEBD0] transition-colors leading-snug">
                  {template.title}
                </h3>
                {template.banca && (
                  <p className="text-xs text-[#F4A261] font-bold mt-2 uppercase tracking-wide">
                    Banca: {template.banca}
                  </p>
                )}

                {/* DESCRIÇÃO */}
                <p className="text-sm text-[#6B99B3] mt-3 line-clamp-3 leading-relaxed font-medium">
                  {template.description}
                </p>

                {/* CHIPS DE MATÉRIAS RESUMIDAS */}
                {template.syllabusSummary && template.syllabusSummary.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {template.syllabusSummary.slice(0, 3).map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#020C14]/80 text-slate-300 border border-[#0A2E45]"
                      >
                        {item}
                      </span>
                    ))}
                    {template.syllabusSummary.length > 3 && (
                      <span className="text-[11px] font-bold px-2 py-1 text-[#6B99B3] bg-[#0A2E45]/30 rounded-md">
                        +{template.syllabusSummary.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* RODAPÉ DO CARD: MÉTRICAS E BOTÃO */}
              <div className="mt-6 pt-5 border-t border-[#0A2E45]/50">
                <div className="flex items-center justify-between text-xs font-semibold text-[#6B99B3] mb-5 px-1">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#F4A261]" />
                    {template.subjectsCount} matérias
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#F4A261]" />
                    {template.topicsCount} tópicos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#F4A261]" />
                    ~{template.estimatedHours}h
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectTemplate?.(template)}
                  disabled={isLoadingTemplate === template.id}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#C41230] hover:bg-[#900B20] disabled:opacity-50 disabled:cursor-not-allowed text-[#FBEBD0] text-sm font-bold shadow-[0_4px_14px_rgba(196,18,48,0.3)] hover:shadow-[0_6px_20px_rgba(196,18,48,0.5)] active:scale-[0.98] transition-all"
                >
                  {isLoadingTemplate === template.id ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-t-[#FBEBD0] border-[rgba(251,235,208,0.3)] rounded-full animate-spin" />
                      Preparando...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Usar Template</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

