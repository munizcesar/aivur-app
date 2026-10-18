"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  PlayCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  Award,
  Sparkles,
  ArrowLeft,
  Calendar,
  Building2,
  Briefcase,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { JornadaDB, JornadaTopicoDB } from "@/lib/validations/jornada";

export interface JornadaFullData extends JornadaDB {
  progresso_geral: number;
  topicos: JornadaTopicoDB[];
}

interface JornadaViewProps {
  initialJornada: JornadaFullData;
}

export default function JornadaView({ initialJornada }: JornadaViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [jornada, setJornada] = useState<JornadaFullData>(initialJornada);
  const [openDisciplinas, setOpenDisciplinas] = useState<Record<string, boolean>>(() => {
    // Open all disciplines by default
    const map: Record<string, boolean> = {};
    initialJornada.topicos.forEach((t) => {
      map[t.disciplina] = true;
    });
    return map;
  });

  const [actionLoadingTopicoId, setActionLoadingTopicoId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Group topics by discipline preserving first occurrence order
  const disciplinesMap = new Map<string, JornadaTopicoDB[]>();
  jornada.topicos.forEach((topico) => {
    const list = disciplinesMap.get(topico.disciplina) || [];
    list.push(topico);
    disciplinesMap.set(topico.disciplina, list);
  });

  const toggleDisciplina = (disc: string) => {
    setOpenDisciplinas((prev) => ({
      ...prev,
      [disc]: !prev[disc],
    }));
  };

  // Find next recommended topic (first not completed, or first topic)
  const proximoTopico =
    jornada.topicos.find((t) => t.status === "em_andamento") ||
    jornada.topicos.find((t) => t.status === "pendente") ||
    jornada.topicos[0];

  const handleStartTopico = async (topico: JornadaTopicoDB) => {
    try {
      setActionLoadingTopicoId(topico.id);
      setErrorMessage(null);

      const res = await fetch(
        `/api/jornadas/${jornada.id}/topicos/${topico.id}/iniciar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = (await res.json()) as { error?: string; trilha_id?: string; success?: boolean };
      if (!res.ok) {
        throw new Error(data.error || "Falha ao iniciar tópico.");
      }

      // Update state locally so UI reflects "em_andamento" if it was not completed
      setJornada((prev) => ({
        ...prev,
        topicos: prev.topicos.map((t) =>
          t.id === topico.id
            ? { ...t, status: t.status === "concluido" ? ("concluido" as const) : ("em_andamento" as const), trilha_id: data.trilha_id }
            : t
        ),
      }));

      // Route directly to the microlearning cockpit
      if (data.trilha_id) {
        router.push(`/trilhas/${data.trilha_id}?jornada_id=${jornada.id}&topico_id=${topico.id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao conectar tópico à sala de estudo.");
    } finally {
      setActionLoadingTopicoId(null);
    }
  };

  const handleConcluirTopico = async (topico: JornadaTopicoDB) => {
    try {
      setActionLoadingTopicoId(topico.id);
      setErrorMessage(null);

      const res = await fetch(
        `/api/jornadas/${jornada.id}/topicos/${topico.id}/concluir`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = (await res.json()) as { error?: string; success?: boolean };
      if (!res.ok) {
        throw new Error(data.error || "Falha ao concluir tópico.");
      }

      setJornada((prev) => {
        const updated = prev.topicos.map((t) =>
          t.id === topico.id ? { ...t, status: "concluido" as const } : t
        );
        const concluidos = updated.filter((t) => t.status === "concluido").length;
        const total = updated.length;
        const progresso_geral = total > 0 ? Math.round((concluidos * 100) / total) : 0;
        return {
          ...prev,
          progresso_geral,
          topicos: updated,
        };
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao registrar conclusão do tópico.");
    } finally {
      setActionLoadingTopicoId(null);
    }
  };

  const handleDeleteJornada = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/jornadas/${jornada.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Falha ao excluir jornada.");
      }
      router.push("/trilhas");
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao excluir jornada.");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const totalTopicos = jornada.topicos.length;
  const concluidosCount = jornada.topicos.filter((t) => t.status === "concluido").length;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/trilhas"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft size={16} className="shrink-0 flex-none" />
          Voltar para Trilhas
        </Link>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
          title="Excluir jornada"
        >
          <Trash2 size={14} className="shrink-0 flex-none" />
          Excluir Jornada
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0 flex-none" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Sparkles size={13} className="shrink-0 flex-none" />
              Jornada de Edital Verticalizado
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text)]">
              {jornada.titulo_concurso}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-[var(--color-text-muted)] pt-1">
              {jornada.cargo && (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase size={14} className="shrink-0 flex-none text-[var(--color-text-muted)]" />
                  {jornada.cargo}
                </span>
              )}
              {jornada.banca && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 size={14} className="shrink-0 flex-none text-[var(--color-text-muted)]" />
                  {jornada.banca}
                </span>
              )}
              {jornada.ano && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} className="shrink-0 flex-none text-[var(--color-text-muted)]" />
                  {jornada.ano}
                </span>
              )}
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center p-4 rounded-xl bg-[var(--color-surface-offset)] border border-[var(--color-border)] min-w-[180px]">
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-text-muted)]">
              Progresso Geral
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-[var(--color-primary)]">
                {jornada.progresso_geral}%
              </span>
            </div>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {concluidosCount} de {totalTopicos} tópicos
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[var(--color-border)] h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-[var(--color-primary)] h-full transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, jornada.progresso_geral))}%` }}
          />
        </div>
      </div>

      {/* Proximo Topico Card (Next Study Recommendation) */}
      {proximoTopico && (
        <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-surface-offset)] to-[var(--color-surface)] border border-[var(--color-primary)]/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-1.5">
              <Award size={14} className="shrink-0 flex-none" />
              Próximo Tópico Recomendado
            </span>
            <p className="text-xs text-[var(--color-text-muted)]">
              {proximoTopico.disciplina} • Tópico #{proximoTopico.ordem_disciplina}
            </p>
            <h3 className="text-base md:text-lg font-bold text-[var(--color-text)]">
              {proximoTopico.titulo_topico}
            </h3>
          </div>

          <button
            onClick={() => handleStartTopico(proximoTopico)}
            disabled={actionLoadingTopicoId === proximoTopico.id}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-95 active:scale-[0.99] transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {actionLoadingTopicoId === proximoTopico.id ? (
              <>
                <Loader2 size={16} className="shrink-0 flex-none animate-spin" />
                <span>Preparando sala...</span>
              </>
            ) : (
              <>
                <PlayCircle size={18} className="shrink-0 flex-none" />
                <span>
                  {proximoTopico.status === "em_andamento" ? "Continuar Estudo" : "Estudar Tópico"}
                </span>
                <ArrowRight size={16} className="shrink-0 flex-none" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Disciplines and Topics Accordion List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
            <BookOpen size={20} className="shrink-0 flex-none text-[var(--color-primary)]" />
            Disciplinas do Edital ({disciplinesMap.size})
          </h2>
          <span className="text-xs text-[var(--color-text-muted)]">
            {totalTopicos} tópicos mapeados
          </span>
        </div>

        <div className="space-y-3">
          {Array.from(disciplinesMap.entries()).map(([disciplina, topicos]) => {
            const isOpen = !!openDisciplinas[disciplina];
            const discConcluidos = topicos.filter((t) => t.status === "concluido").length;
            const discPercent =
              topicos.length > 0 ? Math.round((discConcluidos * 100) / topicos.length) : 0;

            return (
              <div
                key={disciplina}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-xs"
              >
                {/* Discipline Header Toggle */}
                <button
                  type="button"
                  onClick={() => toggleDisciplina(disciplina)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-[var(--color-surface-offset)]/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-semibold text-base text-[var(--color-text)] truncate">
                      {disciplina}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-offset)] border border-[var(--color-border)] text-[var(--color-text-muted)] shrink-0">
                      {discConcluidos}/{topicos.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-2 w-28">
                      <div className="flex-1 bg-[var(--color-border)] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${discPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-[var(--color-text-muted)] w-8 text-right">
                        {discPercent}%
                      </span>
                    </div>

                    {isOpen ? (
                      <ChevronUp size={18} className="shrink-0 flex-none text-[var(--color-text-muted)]" />
                    ) : (
                      <ChevronDown size={18} className="shrink-0 flex-none text-[var(--color-text-muted)]" />
                    )}
                  </div>
                </button>

                {/* Topics List */}
                {isOpen && (
                  <div className="border-t border-[var(--color-border)] divide-y divide-[var(--color-border)]/60 bg-[var(--color-surface-offset)]/30">
                    {topicos.map((topico) => {
                      const isCompleted = topico.status === "concluido";
                      const isInProgress = topico.status === "em_andamento";
                      const isLoading = actionLoadingTopicoId === topico.id;

                      return (
                        <div
                          key={topico.id}
                          className={`px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                            isCompleted ? "opacity-80" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleConcluirTopico(topico)}
                              disabled={isLoading}
                              className="mt-0.5 text-[var(--color-text-muted)] hover:text-emerald-500 transition-colors cursor-pointer shrink-0"
                              title={
                                isCompleted
                                  ? "Tópico concluído"
                                  : "Marcar tópico como concluído"
                              }
                            >
                              {isCompleted ? (
                                <CheckCircle2 size={18} className="shrink-0 flex-none text-emerald-500" />
                              ) : (
                                <Circle size={18} className="shrink-0 flex-none hover:text-emerald-500" />
                              )}
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                                  #{topico.ordem_disciplina}
                                </span>
                                <h4
                                  className={`text-sm font-medium text-[var(--color-text)] ${
                                    isCompleted ? "line-through text-[var(--color-text-muted)]" : ""
                                  }`}
                                >
                                  {topico.titulo_topico}
                                </h4>
                              </div>

                              {topico.edital_item_ref && (
                                <p className="text-xs text-[var(--color-text-muted)] line-clamp-1 mt-0.5">
                                  Ref: {topico.edital_item_ref}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {isInProgress && !isCompleted && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Em andamento
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleStartTopico(topico)}
                              disabled={isLoading}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                isCompleted
                                  ? "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                                  : "bg-[var(--color-primary)] text-white hover:opacity-95"
                              }`}
                            >
                              {isLoading ? (
                                <Loader2 size={13} className="shrink-0 flex-none animate-spin" />
                              ) : (
                                <PlayCircle size={13} className="shrink-0 flex-none" />
                              )}
                              <span>{isCompleted ? "Revisar" : "Estudar"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[var(--color-text)]">
              Excluir Jornada de Estudos?
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Esta ação removerá a jornada &quot;{jornada.titulo_concurso}&quot; e todos os seus tópicos vinculados. As trilhas de estudo geradas individualmente continuarão acessíveis.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-offset)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteJornada}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={13} className="shrink-0 flex-none animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Confirmar Exclusão"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
