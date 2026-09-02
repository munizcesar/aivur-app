"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Sparkles, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  Clock, 
  GraduationCap, 
  Compass,
  AlertTriangle,
  X
} from "lucide-react";
import { useLocalCourses } from "@/hooks/useLocalCourses";
import TemplatesSection from "./TemplatesSection";
import type { Course } from "@/types/course";
import type { CourseTemplate } from "@/data/courses/templates";

interface MinhasTrilhasViewProps {
  onNavigateToCriar: () => void;
  onSelectTemplate?: (template: CourseTemplate) => void;
  isLoadingTemplate?: string | null;
}

export default function MinhasTrilhasView({
  onNavigateToCriar,
  onSelectTemplate,
  isLoadingTemplate,
}: MinhasTrilhasViewProps) {
  const { courses: localCourses, isHydrated, deleteCourse, updateCourse } = useLocalCourses();

  // Progress map: { [courseId]: { done: number, total: number, percent: number } }
  const [progressMap, setProgressMap] = useState<Record<string, { done: number; total: number; percent: number }>>({});
  
  // Modals state
  const [editingCourse, setEditingCourse] = useState<{ id: string; title: string } | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  // Calcula o progresso real de cada trilha a partir do localStorage
  useEffect(() => {
    if (!isHydrated) return;

    const map: Record<string, { done: number; total: number; percent: number }> = {};

    localCourses.forEach((c) => {
      const totalItems = c.subjects.reduce(
        (acc, s) => acc + s.nichos.reduce((a, n) => a + n.items.length, 0),
        0
      );

      let doneItems = 0;
      try {
        const raw = localStorage.getItem(`aivur_checklist_${c.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            doneItems = parsed.length;
          }
        }
      } catch {
        doneItems = 0;
      }

      const percent = totalItems > 0 ? Math.min(100, Math.round((doneItems / totalItems) * 100)) : 0;
      map[c.id] = { done: doneItems, total: totalItems, percent };
    });

    setProgressMap(map);
  }, [localCourses, isHydrated]);

  return (
    <div className="w-full max-w-[1100px] mx-auto px-6 py-8 md:px-12 md:py-16">
      {/* CABEÇALHO DA VIEW 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-8 mb-10 border-b border-[#0A2E45]/50">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A2E45]/40 border border-[#6B99B3]/20 text-[#6B99B3] text-[10px] font-bold uppercase tracking-widest mb-3 shadow-[0_0_10px_rgba(10,46,69,0.5)]">
            <Compass className="w-3.5 h-3.5 text-[#F4A261]" />
            Mentor AIVUR 360 · Painel
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Minhas Trilhas Ativas
          </h1>
          <p className="text-sm text-[#6B99B3] mt-2 max-w-xl font-medium">
            Acompanhe o checklist de metas do seu edital e monitore sua taxa de retenção.
          </p>
        </div>

        {/* AÇÃO PRIMÁRIA (RETORNO/CRIAÇÃO): GERA NOVAS JORNADAS */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={onNavigateToCriar}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C41230] hover:bg-[#900B20] text-[#FBEBD0] text-sm font-bold shadow-[0_4px_14px_rgba(196,18,48,0.3)] hover:shadow-[0_6px_20px_rgba(196,18,48,0.5)] active:scale-[0.98] transition-all cursor-pointer"
            aria-label="Gerar novas trilhas de estudo"
          >
            <Plus className="w-4 h-4" />
            <span>Gerar trilhas</span>
          </button>
        </div>
      </div>

      {/* LISTA DE TRILHAS ATIVAS DO USUÁRIO */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#C41230]" />
            Trilhas em Andamento
          </h2>
          {localCourses.length > 0 && (
            <span className="text-xs text-[#6B99B3] font-semibold">
              {localCourses.length} trilha{localCourses.length !== 1 ? "s" : ""} ativa{localCourses.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {!isHydrated ? (
          <div className="p-12 text-center rounded-2xl border border-[#0A2E45]/40 bg-[#020C14]/50 text-[#6B99B3] animate-pulse">
            Carregando suas trilhas ativas...
          </div>
        ) : localCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {localCourses.map((course) => {
              const prog = progressMap[course.id] || { done: 0, total: 0, percent: 0 };
              const subjectCount = course.subjects.length;

              return (
                <div
                  key={course.id}
                  className="rounded-2xl border border-[#0A2E45]/50 hover:border-[#6B99B3]/40 bg-[#0A2E45]/20 p-6 backdrop-blur-sm transition-all duration-300 flex flex-col justify-between group shadow-[0_8px_30px_rgba(2,12,20,0.5)]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-lg font-bold text-white group-hover:text-[#FBEBD0] transition-colors leading-snug line-clamp-2">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingCourse({ id: course.id, title: course.title })}
                          className="p-1.5 rounded-lg text-[#6B99B3] hover:text-white hover:bg-[#0A2E45]/80 transition-colors"
                          title="Renomear trilha"
                          aria-label="Renomear trilha"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCourse(course)}
                          className="p-1.5 rounded-lg text-[#6B99B3] hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Excluir trilha"
                          aria-label="Excluir trilha"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-[#6B99B3] mb-5">
                      {subjectCount} disciplina{subjectCount !== 1 ? "s" : ""} • {prog.total} tópicos mapeados
                    </p>

                    {/* BARRA DE PROGRESSO */}
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-xs text-[#6B99B3] font-bold">
                        <span>Taxa de Retenção</span>
                        <span className="text-[#F4A261]">{prog.percent}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[#020C14] overflow-hidden border border-[#0A2E45]">
                        <div
                          className="h-full bg-gradient-to-r from-[#C41230] to-[#F4A261] transition-all duration-700 ease-out rounded-full"
                          style={{ width: `${prog.percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-medium text-slate-500">
                        <span>{prog.done} concluídos</span>
                        <span>{prog.total - prog.done} restantes</span>
                      </div>
                    </div>
                  </div>

                  {/* AÇÃO DE ACESSO */}
                  <div className="pt-4 border-t border-[#0A2E45]/40">
                    <Link
                      href={`/mentor/${course.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0A2E45]/60 hover:bg-[#0F3A53] text-[#FBEBD0] text-sm font-bold border border-[#6B99B3]/20 transition-all group-hover:border-[#F4A261]/50 group-hover:shadow-[0_4px_15px_rgba(244,162,97,0.1)]"
                    >
                      <span>Acessar Cronograma</span>
                      <ArrowRight className="w-4 h-4 text-[#F4A261]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ESTADO VAZIO ELEGANTE */
          <div className="rounded-2xl border border-[#0A2E45]/40 bg-[#020C14]/50 p-10 sm:p-14 text-center shadow-[0_8px_30px_rgba(2,12,20,0.6)]">
            <div className="w-14 h-14 rounded-full bg-[#0A2E45]/40 border border-[#6B99B3]/20 flex items-center justify-center mx-auto mb-5 text-[#6B99B3] shadow-[0_0_15px_rgba(10,46,69,0.3)]">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Você ainda não possui trilhas personalizadas
            </h3>
            <p className="text-sm text-[#6B99B3] max-w-md mx-auto mb-8 leading-relaxed">
              Estruture seu conteúdo programático agora para desbloquear seu roteiro de estudos otimizado.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onNavigateToCriar}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#C41230] hover:bg-[#900B20] text-[#FBEBD0] text-sm font-bold shadow-[0_4px_14px_rgba(196,18,48,0.3)] hover:shadow-[0_6px_20px_rgba(196,18,48,0.5)] active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Gerar nova trilha</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO DE TEMPLATES (CURSOS PRÉ-CONFIGURADOS) */}
      <TemplatesSection onSelectTemplate={onSelectTemplate} isLoadingTemplate={isLoadingTemplate} />

      {/* MODAL: RENOMEAR TRILHA */}
      {editingCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setEditingCourse(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[rgba(107,153,179,0.3)] bg-[#0A2E45] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Renomear Trilha</h3>
              <button
                onClick={() => setEditingCourse(null)}
                className="text-[#6B99B3] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-[rgba(107,153,179,0.3)] bg-[#020C14] text-white text-sm focus:border-[#C41230] outline-none mb-5"
              value={editingCourse.title}
              onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && editingCourse.title.trim()) {
                  updateCourse(editingCourse.id, { title: editingCourse.title.trim() });
                  setEditingCourse(null);
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="px-4 py-2 rounded-lg border border-[rgba(107,153,179,0.3)] text-slate-300 text-xs font-semibold hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingCourse.title.trim()) {
                    updateCourse(editingCourse.id, { title: editingCourse.title.trim() });
                    setEditingCourse(null);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[#C41230] hover:bg-[#6B0000] text-[#FBEBD0] text-xs font-bold shadow-[2px_2px_0px_#6B0000]"
              >
                Salvar Alteração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO */}
      {deletingCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setDeletingCourse(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-red-800/60 bg-[#0A2E45] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3 text-red-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-white">Excluir Trilha</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
              Tem certeza que deseja apagar a trilha <strong>"{deletingCourse.title}"</strong>? Todo o progresso do checklist e dados gerados serão permanentemente excluídos.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingCourse(null)}
                className="px-4 py-2 rounded-lg border border-[rgba(107,153,179,0.3)] text-slate-300 text-xs font-semibold hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCourse(deletingCourse.id);
                  setDeletingCourse(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-[2px_2px_0px_#6B0000]"
              >
                Sim, excluir trilha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

