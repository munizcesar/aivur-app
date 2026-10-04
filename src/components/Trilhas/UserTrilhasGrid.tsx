"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Layers,
  ListChecks,
  CheckCircle2,
  Circle,
  ArrowRight,
  Edit3,
  Trash2,
  Compass,
  AlertTriangle,
  X,
} from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";
import type { TrilhaTemplateType } from "@/lib/validations/trilha";
import TrilhaProgressBar from "./TrilhaProgressBar";

export default function UserTrilhasGrid() {
  const {
    customTrilhas,
    deleteCustomTrilha,
    updateCustomTrilha,
    progressData,
    completedTopicIds,
    selectedVideoByTrilha,
  } = useStudyStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [dataResetMessage, setDataResetMessage] = useState<string | null>(null);

  const [apiTrilhas, setApiTrilhas] = useState<TrilhaTemplateType[] | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(true);
  const [apiFailed, setApiFailed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);

    let isMounted = true;
    async function fetchApi() {
      try {
        const res = await fetch("/api/trilhas");
        if (!res.ok) throw new Error("Falha na resposta da API");
        const json = await res.json() as { trilhas?: TrilhaTemplateType[] };
        if (isMounted) {
          setApiTrilhas(json.trilhas || []);
        }
      } catch (err) {
        if (isMounted) {
          console.warn("[UserTrilhasGrid] Falha ao carregar API, ativando fallback do Zustand.", err);
          setApiFailed(true);
        }
      } finally {
        if (isMounted) {
          setIsApiLoading(false);
        }
      }
    }
    
    fetchApi();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || !apiFailed) return;

    // Validação defensiva: checar schema antigo e propriedades obrigatórias
    let purged = false;
    customTrilhas.forEach(trilha => {
      if (
        !trilha ||
        !trilha.id ||
        !trilha.titulo ||
        !trilha.questoes ||
        !Array.isArray(trilha.questoes)
      ) {
        console.warn(`[UserTrilhasGrid] Descartando trilha corrompida/antiga (ID: ${trilha?.id || 'desconhecido'}).`);
        if (trilha?.id) deleteCustomTrilha(trilha.id);
        purged = true;
      }
    });

    if (purged) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDataResetMessage("Algumas trilhas antigas foram resetadas por incompatibilidade de formato.");
    }
  }, [customTrilhas, deleteCustomTrilha, isHydrated, apiFailed]);

  // Apenas as válidas da fonte correta (API ou fallback)
  const rawTrilhas = apiFailed ? customTrilhas : (apiTrilhas || []);
  const validTrilhas = rawTrilhas.filter(t => t && t.id && t.titulo && t.questoes && Array.isArray(t.questoes));

  const [editingCourse, setEditingCourse] = useState<{ id: string; titulo: string } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState<TrilhaTemplateType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fecha modais com Esc (acessibilidade)
  useEffect(() => {
    if (!editingCourse && !deletingCourse) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditingCourse(null);
        setDeletingCourse(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingCourse, deletingCourse]);

  const saveRename = async () => {
    if (editingCourse && editingCourse.titulo.trim()) {
      const newTitle = editingCourse.titulo.trim();
      const currentTrilha = validTrilhas.find(t => t.id === editingCourse.id);
      
      if (!currentTrilha) return;

      setIsSavingEdit(true);

      if (!apiFailed) {
        const payload = { ...currentTrilha, titulo: newTitle };
        try {
          const res = await fetch(`/api/trilhas/${editingCourse.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!res.ok) {
             throw new Error("Falha ao salvar a edição no servidor.");
          }

          const { trilha } = (await res.json()) as any;
          // Atualiza a lista da API com o DTO retornado pelo PUT
          setApiTrilhas(prev => prev ? prev.map(t => t.id === editingCourse.id ? trilha : t) : null);
          setEditingCourse(null);
        } catch (err) {
          console.error(err);
          alert("Não foi possível renomear a trilha. Verifique sua conexão e tente novamente.");
        } finally {
          setIsSavingEdit(false);
        }
      } else {
        // Fallback: usar Zustand apenas se a API estiver fora
        updateCustomTrilha(editingCourse.id, { titulo: newTitle });
        setEditingCourse(null);
        setIsSavingEdit(false);
      }
    }
  };

  const confirmDelete = async () => {
    if (!deletingCourse) return;
    
    setIsDeleting(true);
    if (!apiFailed) {
      try {
        const res = await fetch(`/api/trilhas/${deletingCourse.id}`, {
          method: 'DELETE',
        });
        
        if (!res.ok) {
          throw new Error('Falha ao excluir a trilha no servidor.');
        }
        
        // Atualiza UI apenas se servidor confirmar (204 etc)
        setApiTrilhas(prev => prev ? prev.filter(t => t.id !== deletingCourse.id) : null);
        setDeletingCourse(null);
      } catch (err) {
        console.error(err);
        alert("Não foi possível excluir a trilha. Verifique sua conexão e tente novamente.");
      } finally {
        setIsDeleting(false);
      }
    } else {
      // Fallback local
      deleteCustomTrilha(deletingCourse.id);
      setDeletingCourse(null);
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full">
      {/* CABEÇALHO DA SEÇÃO */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h2
            id="minhas-trilhas-title"
            className="m-0 text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-heading)]"
          >
            Minhas trilhas
          </h2>
          <p className="m-0 mt-1 text-sm sm:text-base text-[var(--color-text-muted)] max-w-xl">
            Acompanhe o checklist de metas do seu concurso e monitore sua taxa de retenção.
          </p>
        </div>
        {isHydrated && validTrilhas.length > 0 && (
          <span className="shrink-0 inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-bold text-[var(--color-text-muted)]">
            {validTrilhas.length} trilha{validTrilhas.length !== 1 ? "s" : ""} ativa{validTrilhas.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* MENSAGEM DE RESET SE HOUVER */}
      {dataResetMessage && (
        <div
          role="status"
          className="mb-6 p-4 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-[var(--color-text)] text-sm flex items-start gap-3"
        >
          <AlertTriangle size={20} className="shrink-0 flex-none mt-0.5 text-[var(--color-warning)]" aria-hidden="true" />
          <p className="m-0">{dataResetMessage}</p>
          <button
            type="button"
            onClick={() => setDataResetMessage(null)}
            aria-label="Fechar aviso"
            className="ml-auto p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <X size={16} className="shrink-0 flex-none" />
          </button>
        </div>
      )}

      {/* LISTA */}
      {!isHydrated || isApiLoading ? (
        <div aria-busy="true" aria-live="polite">
          <p className="sr-only">Carregando suas trilhas ativas...</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[0, 1].map(i => (
              <div
                key={i}
                className="h-[260px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 animate-pulse"
              >
                <div className="h-4 w-24 rounded-full bg-[var(--color-surface-offset)]" />
                <div className="mt-4 h-5 w-3/4 rounded bg-[var(--color-surface-offset)]" />
                <div className="mt-2 h-3 w-1/2 rounded bg-[var(--color-surface-offset)]" />
                <div className="mt-8 h-2 w-full rounded-full bg-[var(--color-surface-offset)]" />
                <div className="mt-10 h-10 w-full rounded-xl bg-[var(--color-surface-offset)]" />
              </div>
            ))}
          </div>
        </div>
      ) : validTrilhas.length > 0 ? (
        <ul className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {validTrilhas.map((trilha) => {
            // Progresso: mesma regra original (questões com resposta registrada como acerto).
            let questoesAcertadas = 0;
            trilha.questoes.forEach(q => {
              if (progressData.answers[q.id]) questoesAcertadas++;
            });
            const percent = trilha.questoes.length > 0
              ? Math.round((questoesAcertadas / trilha.questoes.length) * 100)
              : 0;

            // Etapas: espelha (somente leitura) os critérios de conclusão já usados pelo Cockpit V2.
            const qIds = trilha.questoes.map(q => String(q.id));
            const etapas = [
              { key: "video", label: "Vídeo", done: !!selectedVideoByTrilha?.[trilha.id] },
              { key: "resumo", label: "Resumo", done: completedTopicIds.includes(`${trilha.id}-resumo`) },
              { key: "flashcards", label: "Flashcards", done: completedTopicIds.includes(`${trilha.id}-flashcards`) },
              {
                key: "questoes",
                label: "Questões",
                done: qIds.length > 0 && qIds.every(id => progressData.answers[id] !== undefined),
              },
            ];
            const etapasFeitas = etapas.filter(e => e.done).length;
            const iniciada = percent > 0 || etapasFeitas > 0;
            const flashcardsCount = Array.isArray(trilha.flashcards) ? trilha.flashcards.length : 0;

            return (
              <li
                key={trilha.id}
                className="group flex flex-col min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-primary)]/40"
              >
                {/* Topo: disciplina + ações */}
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 truncate inline-flex items-center rounded-full bg-[var(--color-primary)]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                    {trilha.disciplina || "Trilha personalizada"}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0 -mr-1.5 -mt-1">
                    <button
                      type="button"
                      onClick={() => setEditingCourse({ id: trilha.id, titulo: trilha.titulo })}
                      aria-label={`Renomear trilha ${trilha.titulo}`}
                      title="Renomear"
                      className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-offset)] transition-colors"
                    >
                      <Edit3 size={16} strokeWidth={1.5} className="shrink-0 flex-none" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCourse(trilha)}
                      aria-label={`Excluir trilha ${trilha.titulo}`}
                      title="Excluir"
                      className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-red)] hover:bg-[var(--color-red)]/10 transition-colors"
                    >
                      <Trash2 size={16} strokeWidth={1.5} className="shrink-0 flex-none" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Título + metadados */}
                <h3 className="m-0 mt-3 text-lg font-bold leading-snug text-[var(--color-heading)] line-clamp-2 break-words">
                  {trilha.titulo}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <ListChecks size={14} strokeWidth={1.5} className="shrink-0 flex-none" aria-hidden="true" />
                    {trilha.questoes.length} questões
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Layers size={14} strokeWidth={1.5} className="shrink-0 flex-none" aria-hidden="true" />
                    {flashcardsCount} flashcards
                  </span>
                </div>

                {/* Progresso */}
                <div className="mt-5">
                  <TrilhaProgressBar percent={percent} label="Progresso de retenção" />
                </div>

                {/* Etapas concluídas */}
                <div className="mt-4">
                  <p className="m-0 mb-2 text-xs font-semibold text-[var(--color-text-muted)]">
                    Etapas concluídas: <span className="text-[var(--color-heading)] font-bold tabular-nums">{etapasFeitas}/4</span>
                  </p>
                  <ul className="m-0 p-0 list-none flex flex-wrap gap-1.5" aria-label="Etapas da trilha">
                    {etapas.map(e => (
                      <li
                        key={e.key}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          e.done
                            ? "border-[var(--color-success)]/40 bg-[var(--color-success)]/10 text-[var(--color-success)]"
                            : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                        }`}
                      >
                        {e.done ? (
                          <CheckCircle2 size={12} className="shrink-0 flex-none" aria-hidden="true" />
                        ) : (
                          <Circle size={12} className="shrink-0 flex-none" aria-hidden="true" />
                        )}
                        {e.label}
                        <span className="sr-only">{e.done ? " (concluída)" : " (pendente)"}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Ação principal */}
                <Link
                  href={`/trilhas/${trilha.id}`}
                  className="mt-6 pt-0 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C41230] hover:bg-[#6B0000] px-4 py-3 text-sm font-bold text-[#FFFFFF] no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C41230]"
                >
                  {iniciada ? "Continuar trilha" : "Iniciar trilha"}
                  <ArrowRight size={16} strokeWidth={1.5} className="shrink-0 flex-none transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 sm:py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4 text-[var(--color-primary)]">
            <Compass size={24} strokeWidth={1.5} className="shrink-0 flex-none" aria-hidden="true" />
          </div>
          <h3 className="m-0 text-lg font-bold text-[var(--color-heading)]">
            Você ainda não possui trilhas personalizadas
          </h3>
          <p className="m-0 mt-2 text-sm text-[var(--color-text-muted)] max-w-md mx-auto">
            Gere sua primeira trilha com IA a partir do seu edital ou material de estudo.
          </p>
          <Link
            href="/trilhas/novo"
            className="mt-5 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C41230] px-5 py-3 text-sm font-bold text-[#FFFFFF] no-underline transition-colors hover:bg-[#6B0000]"
          >
            <Sparkles size={16} strokeWidth={1.5} className="shrink-0 flex-none" aria-hidden="true" />
            Gerar trilha com IA
          </Link>
        </div>
      )}

      {editingCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setEditingCourse(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-trilha-title"
            className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="rename-trilha-title" className="m-0 text-lg font-bold text-[var(--color-heading)]">Renomear trilha</h3>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                aria-label="Fechar"
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-offset)]"
              >
                <X size={20} strokeWidth={1.5} className="shrink-0 flex-none" aria-hidden="true" />
              </button>
            </div>
            <label htmlFor="rename-trilha-input" className="sr-only">Novo nome da trilha</label>
            <input
              id="rename-trilha-input"
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-heading)] text-sm focus:border-[var(--color-primary)] outline-none mb-5"
              value={editingCourse.titulo}
              onChange={(e) => setEditingCourse({ ...editingCourse, titulo: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRename();
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] text-sm font-semibold hover:bg-[var(--color-surface-offset)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveRename}
                disabled={!editingCourse.titulo.trim() || isSavingEdit}
                className="px-4 py-2 rounded-xl bg-[#C41230] hover:bg-[#6B0000] text-[#FFFFFF] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingEdit ? 'Salvando...' : 'Salvar alteração'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setDeletingCourse(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-trilha-title"
            aria-describedby="delete-trilha-desc"
            className="w-full max-w-md rounded-2xl border border-[var(--color-red)]/30 bg-[var(--color-surface)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3 text-[var(--color-red)]">
              <AlertTriangle size={24} strokeWidth={1.5} className="shrink-0 flex-none" aria-hidden="true" />
              <h3 id="delete-trilha-title" className="m-0 text-lg font-bold text-[var(--color-heading)]">Excluir trilha</h3>
            </div>
            <p id="delete-trilha-desc" className="m-0 text-sm text-[var(--color-text-muted)] mb-5 leading-relaxed">
              Tem certeza que deseja apagar a trilha <strong className="text-[var(--color-heading)]">&quot;{deletingCourse.titulo}&quot;</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setDeletingCourse(null)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] text-sm font-semibold hover:bg-[var(--color-surface-offset)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-[#C41230] hover:opacity-90 text-[#FFFFFF] text-sm font-bold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, excluir trilha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
