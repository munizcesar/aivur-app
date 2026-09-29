"use client";

import { useState } from "react";
import Link from "next/link";
import { useStudyStore } from "@/store/useStudyStore";
import Header from "@/components/Header/Header";
import { FolderCheck, Edit2, Trash2, Layers, BookOpen, ExternalLink, Plus } from "lucide-react";

export default function MaterialPage() {
  const { customTrilhas, deleteCustomTrilha, updateCustomTrilha } = useStudyStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      updateCustomTrilha(editingId, { titulo: editTitle.trim() });
    }
    setEditingId(null);
    setEditTitle("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-default)]">
      <Header />
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-text)]">Meus Materiais</h1>
            <p className="text-[var(--color-text-muted)] mt-1">
              Gerencie e estude seus PDFs e editais processados.
            </p>
          </div>
          <Link href="/trilhas/novo" className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-bold transition-all">
            <Plus size={18} className="shrink-0" /> Novo Material
          </Link>
        </div>

        {customTrilhas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-center">
            <Layers size={48} className="text-[var(--color-text-faint)] mb-4 shrink-0" />
            <h2 className="text-xl font-bold text-[var(--color-heading)]">Nenhum material encontrado</h2>
            <p className="text-[var(--color-text-muted)] mt-2 mb-6 max-w-md">
              Você ainda não processou nenhum PDF ou edital. Crie seu primeiro material para começar a estudar.
            </p>
            <Link href="/trilhas/novo" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-bold transition-all">
              <Plus size={18} className="shrink-0" /> Extrair Material com IA
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customTrilhas.map((trilha) => (
              <div key={trilha.id} className="flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden hover:border-[var(--color-primary)] transition-all group">
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wide">
                      <BookOpen size={14} className="shrink-0" /> {trilha.disciplina || "Geral"}
                    </span>
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEditing(trilha.id, trilha.titulo)}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] rounded-md hover:bg-[var(--color-bg)] transition-colors"
                        title="Renomear"
                      >
                        <Edit2 size={16} className="shrink-0" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este material?')) {
                            deleteCustomTrilha(trilha.id);
                          }
                        }}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-red)] rounded-md hover:bg-[var(--color-red)]/10 transition-colors"
                        title="Deletar"
                      >
                        <Trash2 size={16} className="shrink-0" />
                      </button>
                    </div>
                  </div>
                  
                  {editingId === trilha.id ? (
                    <div className="mb-2">
                      <input 
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="w-full px-3 py-2 border border-[var(--color-primary)] rounded bg-[var(--color-bg)] text-[var(--color-text)] font-bold text-lg outline-none"
                      />
                    </div>
                  ) : (
                    <h3 className="text-lg font-bold text-[var(--color-heading)] mb-2 line-clamp-2">
                      {trilha.titulo}
                    </h3>
                  )}
                  
                  <div className="mt-auto pt-4 flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <FolderCheck size={14} className="shrink-0" /> {trilha.questoes?.length || 0} questões
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers size={14} className="shrink-0" /> {trilha.flashcards?.length || 0} flashcards
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-[var(--color-border)] p-4 bg-black/10">
                  <Link href={`/trilhas/${trilha.id}`} className="flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--color-bg)] hover:bg-[var(--color-primary)] hover:text-[var(--color-white)] border border-[var(--color-border)] hover:border-transparent text-[var(--color-text)] rounded-lg font-bold transition-all">
                    Acessar Laboratório <ExternalLink size={16} className="shrink-0" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
