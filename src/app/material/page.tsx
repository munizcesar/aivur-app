"use client";

import { useState } from "react";
import Link from "next/link";
import { useStudyStore } from "@/store/useStudyStore";
import Header from "@/components/Header/Header";
import { FolderCheck, Edit2, Trash2, Layers, BookOpen, ExternalLink, Plus, UploadCloud } from "lucide-react";
import styles from "./Material.module.css";

export default function MaterialPage() {
  const { customTrilhas, deleteCustomTrilha, updateCustomTrilha } = useStudyStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className="container">
          
          <div className={styles.headerClean}>
            <div>
              <h1 className={styles.headerTitle}>Meus Materiais</h1>
              <p className={styles.headerSubtitle}>
                Gerencie e estude seus PDFs e editais processados.
              </p>
            </div>
            <Link href="/trilhas/novo" className={styles.btnSecondary}>
              <Plus size={18} /> Novo Material
            </Link>
          </div>

          {customTrilhas.length === 0 ? (
            <div className={styles.uploadContainer}>
              <div className={styles.heroHeader}>
                <div className={styles.heroTextCol}>
                  <h1 className={styles.title}>Cofre Editorial</h1>
                  <p className={styles.subtitle}>
                    Envie aquele PDF denso ou resumo e deixe a IA extrair o suprassumo em segundos.
                  </p>
                </div>
                <div className={styles.heroImageCol}>
                  {/*eslint-disable-next-line @next/next/no-img-element*/}
                  <img src="/images/aivur/material.png" alt="Aivur Cofre 3D" />
                </div>
              </div>

              <Link href="/trilhas/novo" className={styles.dropzone}>
                <div className={styles.dropzoneInner}>
                  <UploadCloud width={48} height={48} className={styles.dropIcon} />
                  <h3>Criar novo material</h3>
                </div>
              </Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {customTrilhas.map((trilha) => (
                <div key={trilha.id} className={styles.card}>
                  <div className={styles.cardBody}>
                    <div className={styles.cardHeader}>
                      <span className={styles.tag}>
                        <BookOpen size={14} /> {trilha.disciplina || "Geral"}
                      </span>
                      <div className={styles.actions}>
                        <button 
                          onClick={() => startEditing(trilha.id, trilha.titulo)}
                          className={styles.iconBtn}
                          title="Renomear"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(trilha.id)}
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          title="Deletar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {editingId === trilha.id ? (
                      <div style={{ marginBottom: "0.5rem" }}>
                        <input 
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className={styles.inputRename}
                        />
                      </div>
                    ) : (
                      <h3 className={styles.cardTitle}>
                        {trilha.titulo}
                      </h3>
                    )}
                    
                    <div className={styles.cardStats}>
                      <span className={styles.stat}>
                        <FolderCheck size={14} /> {trilha.questoes?.length || 0} questões
                      </span>
                      <span className={styles.stat}>
                        <Layers size={14} /> {trilha.flashcards?.length || 0} flashcards
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.cardFooter}>
                    <Link href={`/trilhas/${trilha.id}?from=material`} className={styles.btnFooter}>
                      Acessar Laboratório <ExternalLink size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {deleteId && (
        <div 
          className={styles.modalOverlay}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setDeleteId(null);
          }}
        >
          <div className={styles.modalContent}>
            <Trash2 size={40} className={styles.modalIcon} />
            <h3 className={styles.modalTitle}>Excluir Material?</h3>
            <p className={styles.modalText}>
              Esta ação removerá todo o progresso, questões e flashcards desta trilha. Não pode ser desfeita.
            </p>
            <div className={styles.modalActions}>
              <button 
                autoFocus
                onClick={() => setDeleteId(null)}
                className={styles.btnKeep}
              >
                Manter
              </button>
              <button 
                onClick={() => {
                  deleteCustomTrilha(deleteId);
                  setDeleteId(null);
                }}
                className={styles.btnDanger}
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
