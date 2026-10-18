"use client";

import { useState } from "react";
import { Check, Trash2, Edit2, Sparkles, AlertCircle, X, Layers } from "lucide-react";
import type { JornadaEmentaType } from "@/lib/validations/jornada";

interface EmentaReviewModalProps {
  initialEmenta: JornadaEmentaType;
  docOriginalHash: string;
  editalFonteTipo: "TEXTO" | "PDF";
  editalNomeArquivo?: string;
  onConfirm: (finalEmenta: JornadaEmentaType) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  saveError: string | null;
}

export default function EmentaReviewModal({
  initialEmenta,
  onConfirm,
  onCancel,
  isSaving,
  saveError,
}: EmentaReviewModalProps) {
  const [ementa, setEmenta] = useState<JornadaEmentaType>(initialEmenta);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(ementa.titulo_concurso);

  const totalTopicos = ementa.disciplinas.reduce(
    (acc, d) => acc + d.topicos.length,
    0
  );

  const removeTopico = (discIdx: number, topicoIdx: number) => {
    setEmenta((prev) => {
      const nextDisc = [...prev.disciplinas];
      const targetDisc = { ...nextDisc[discIdx] };
      targetDisc.topicos = targetDisc.topicos.filter((_, idx) => idx !== topicoIdx);

      if (targetDisc.topicos.length === 0) {
        // Se a matéria ficou sem tópicos, remove a matéria
        nextDisc.splice(discIdx, 1);
      } else {
        nextDisc[discIdx] = targetDisc;
      }

      return { ...prev, disciplinas: nextDisc };
    });
  };

  const removeDisciplina = (discIdx: number) => {
    setEmenta((prev) => ({
      ...prev,
      disciplinas: prev.disciplinas.filter((_, idx) => idx !== discIdx),
    }));
  };

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      setEmenta((prev) => ({ ...prev, titulo_concurso: tempTitle.trim() }));
      setEditingTitle(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-offset)]/50">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Sparkles size={20} />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Revisão Pedagógica Pré-Gravação
              </span>
              <h2 className="text-lg font-extrabold text-[var(--color-heading)] m-0">
                Estrutura do Edital Identificada
              </h2>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-border)] transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {saveError && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Dados do Concurso */}
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-[var(--color-surface)] border border-[var(--color-primary)] text-[var(--color-heading)] focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="px-3 py-1.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-lg"
                  >
                    Salvar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h3 className="text-base font-bold text-[var(--color-heading)] m-0 truncate">
                    {ementa.titulo_concurso}
                  </h3>
                  <button
                    onClick={() => {
                      setTempTitle(ementa.titulo_concurso);
                      setEditingTitle(true);
                    }}
                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                    title="Editar título"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-[var(--color-text-muted)]">
                {ementa.banca && <span>Banca: <strong>{ementa.banca}</strong></span>}
                {ementa.cargo && <span>• Cargo: <strong>{ementa.cargo}</strong></span>}
                {ementa.ano && <span>• Ano: <strong>{ementa.ano}</strong></span>}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1 rounded-full bg-[var(--color-surface-offset)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-heading)]">
                {ementa.disciplinas.length} Matérias • {totalTopicos} Tópicos
              </span>
            </div>
          </div>

          <p className="text-xs text-[var(--color-text-muted)] m-0">
            Você pode revisar e excluir matérias ou tópicos que não queira incluir na sua jornada antes de confirmar.
          </p>

          {/* Disciplinas e Tópicos */}
          <div className="space-y-4">
            {ementa.disciplinas.map((disc, dIdx) => (
              <div
                key={dIdx}
                className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-xs font-extrabold shrink-0">
                      {dIdx + 1}
                    </span>
                    <span className="font-bold text-sm text-[var(--color-heading)] truncate">
                      {disc.nome}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      ({disc.topicos.length} tópicos)
                    </span>
                  </div>
                  <button
                    onClick={() => removeDisciplina(dIdx)}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors text-xs inline-flex items-center gap-1"
                    title="Excluir disciplina inteira"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">Excluir Matéria</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {disc.topicos.map((topico, tIdx) => (
                    <div
                      key={tIdx}
                      className="group flex items-start justify-between gap-2 p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-[var(--color-heading)] line-clamp-2">
                          {topico.titulo}
                        </span>
                        {topico.edital_item_ref && (
                          <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">
                            Ref: {topico.edital_item_ref}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeTopico(dIdx, tIdx)}
                        className="opacity-60 group-hover:opacity-100 p-1 text-[var(--color-text-muted)] hover:text-red-400 transition-colors shrink-0"
                        title="Remover tópico"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-offset)]/50">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-heading)] text-sm font-semibold hover:bg-[var(--color-surface)] transition-colors"
          >
            Voltar e Ajustar
          </button>

          <button
            type="button"
            onClick={() => onConfirm(ementa)}
            disabled={isSaving || ementa.disciplinas.length === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[#6B0000] text-white text-sm font-bold transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <span>Salvando Jornada...</span>
            ) : (
              <>
                <Check size={16} />
                <span>Confirmar e Criar Jornada ({totalTopicos} Tópicos)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
