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
import { useStudyStore } from "@/store/useStudyStore";
import type { TrilhaTemplateType } from "@/lib/validations/trilha";
import type { CourseTemplate } from "@/data/courses/templates";



export default function UserTrilhasGrid() {
  const { customTrilhas, deleteCustomTrilha, updateCustomTrilha, progressData } = useStudyStore();
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);

    // Validação defensiva: checar schema antigo (falta de array 'questoes')
    // Removemos do store as trilhas corrompidas para evitar crashes futuros.
    customTrilhas.forEach(trilha => {
      if (!trilha.questoes || !Array.isArray(trilha.questoes)) {
        console.warn(`[UserTrilhasGrid] Descartando trilha corrompida/antiga (ID: ${trilha.id} - ${trilha.titulo}). Falta a propriedade 'questoes' (array).`);
        deleteCustomTrilha(trilha.id);
      }
    });
  }, [customTrilhas, deleteCustomTrilha]);

  // Apenas as válidas
  const validTrilhas = customTrilhas.filter(t => t.questoes && Array.isArray(t.questoes));

  const [editingCourse, setEditingCourse] = useState<{ id: string; titulo: string } | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<TrilhaTemplateType | null>(null);

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 md:px-0 mb-12">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-[rgba(107,153,179,0.2)]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--color-primary)]/15 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider mb-2">
            <Compass className="w-3.5 h-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
            Mentor AIVUR 360 · Painel
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-heading)] tracking-tight">
            Minhas Trilhas Ativas
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-muted)] mt-1 max-w-xl">
            Acompanhe o checklist de metas do seu concurso e monitore sua taxa de retenção.
          </p>
        </div>

        
      </div>

      {/* LISTA */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-heading)] flex items-center gap-2">
            <GraduationCap className="w-5 h-5 shrink-0 text-[var(--color-primary)]" strokeWidth={2.2} aria-hidden="true" />
            Trilhas em Andamento
          </h2>
          {validTrilhas.length > 0 && (
            <span className="text-xs text-[var(--color-text-muted)] font-semibold">
              {validTrilhas.length} trilha{validTrilhas.length !== 1 ? "s" : ""} ativa{validTrilhas.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {!isHydrated ? (
          <div className="p-8 text-center rounded-xl border border-[rgba(107,153,179,0.2)] bg-[var(--color-surface)]/20 text-[var(--color-text-muted)] animate-pulse">
            Carregando suas trilhas ativas...
          </div>
        ) : validTrilhas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {validTrilhas.map((trilha) => {
              // Calcula progresso pelas questoes e flashcards se quiser, mas por simplicidade usaremos trilha.progresso ou progressData.
              let questoesAcertadas = 0;
              trilha.questoes.forEach(q => {
                if (progressData.answers[q.id]) questoesAcertadas++;
              });
              const percent = trilha.questoes.length > 0 
                ? Math.round((questoesAcertadas / trilha.questoes.length) * 100) 
                : 0;

              return (
                <div
                  key={trilha.id}
                  className="rounded-xl border border-[rgba(107,153,179,0.2)] hover:border-[rgba(107,153,179,0.4)] bg-[var(--color-surface)]/30 p-5 backdrop-blur-sm transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-bold text-[var(--color-heading)] group-hover:text-[var(--color-heading)] transition-colors leading-snug line-clamp-2">
                        {trilha.titulo}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingCourse({ id: trilha.id, titulo: trilha.titulo })}
                          className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-bg)]/50 transition-colors"
                        >
                          <Edit3 className="w-4 h-4 shrink-0" strokeWidth={2.1} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCourse(trilha)}
                          className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg)]/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" strokeWidth={2.1} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--color-text-muted)] mb-4">
                      {trilha.disciplina} • {trilha.questoes.length} questões mapeadas
                    </p>

                    <div className="space-y-1.5 mb-5">
                      <div className="flex justify-between text-xs text-[var(--color-text-muted)] font-semibold">
                        <span>Progresso de retenção</span>
                        <span className="text-[var(--color-heading)] font-bold">{percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--color-bg)]/80 overflow-hidden border border-[rgba(107,153,179,0.15)]">
                        <div
                          className="h-full bg-[var(--color-primary)] transition-all duration-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 mt-auto border-t border-[rgba(107,153,179,0.15)] bg-[var(--color-surface-offset)]">
                    <Link
                      href={`/trilhas/${trilha.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-offset)] text-[var(--color-heading)] text-xs sm:text-sm font-bold border border-[rgba(107,153,179,0.25)] transition-all group-hover:border-[var(--color-text-muted)]/60"
                    >
                      <span>Acessar Cronograma</span>
                      <ArrowRight className="w-4 h-4 shrink-0 text-[var(--color-primary)]" strokeWidth={2.2} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-[rgba(107,153,179,0.2)] bg-[var(--color-surface)]/20 p-8 sm:p-10 text-center backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center mx-auto mb-4 text-[var(--color-primary)]">
              <Compass className="w-6 h-6 shrink-0" strokeWidth={2.1} aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-heading)] mb-1">
              Você ainda não possui trilhas personalizadas
            </h3>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-md mx-auto mt-2 italic">Nenhuma trilha ainda — use o botão no topo da página para gerar a primeira.</p>
          </div>
        )}
      </div>

      

      {editingCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setEditingCourse(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[rgba(107,153,179,0.3)] bg-[var(--color-surface)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--color-heading)]">Renomear Trilha</h3>
              <button
                onClick={() => setEditingCourse(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-heading)] p-1"
              >
              <X className="w-5 h-5 shrink-0" strokeWidth={2.1} aria-hidden="true" />
              </button>
            </div>
            <input
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-[rgba(107,153,179,0.3)] bg-[var(--color-bg)] text-[var(--color-heading)] text-sm focus:border-[var(--color-primary)] outline-none mb-5"
              value={editingCourse.titulo}
              onChange={(e) => setEditingCourse({ ...editingCourse, titulo: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && editingCourse.titulo.trim()) {
                  updateCustomTrilha(editingCourse.id, { titulo: editingCourse.titulo.trim() });
                  setEditingCourse(null);
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="px-4 py-2 rounded-lg border border-[rgba(107,153,179,0.3)] text-[var(--color-text-muted)] text-xs font-semibold hover:bg-[var(--color-surface-offset)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingCourse.titulo.trim()) {
                    updateCustomTrilha(editingCourse.id, { titulo: editingCourse.titulo.trim() });
                    setEditingCourse(null);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-heading)] text-xs font-bold shadow-[2px_2px_0px_#6B0000]"
              >
                Salvar Alteração
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setDeletingCourse(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--color-red)]/30 bg-[var(--color-surface)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3 text-[var(--color-red)]">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" strokeWidth={2.1} aria-hidden="true" />
              <h3 className="text-lg font-bold text-[var(--color-heading)]">Excluir Trilha</h3>
            </div>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mb-5 leading-relaxed">
              Tem certeza que deseja apagar a trilha <strong>"{deletingCourse.titulo}"</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingCourse(null)}
                className="px-4 py-2 rounded-lg border border-[rgba(107,153,179,0.3)] text-[var(--color-text-muted)] text-xs font-semibold hover:bg-[var(--color-surface-offset)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCustomTrilha(deletingCourse.id);
                  setDeletingCourse(null);
                }}
                className="px-4 py-2 rounded-lg bg-[var(--color-red)] hover:opacity-90 text-white text-xs font-bold transition-opacity"
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


