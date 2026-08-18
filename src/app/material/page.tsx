"use client";

import { useState } from "react";
import styles from "./Material.module.css";
import Header from "@/components/Header/Header";
import { UploadCloud, Layers, ArrowLeft } from "lucide-react";
import QuizTool from "./QuizTool";
import FlashcardsTool from "./FlashcardsTool";

export default function MaterialPage() {
  const [isProcessed, setIsProcessed] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const handleProcess = () => {
    // Simulando transição do upload pro laboratório processado
    setIsProcessed(true);
  };

  const handleReset = () => {
    setIsProcessed(false);
    setActiveTab(null);
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        {!isProcessed ? (
          // ESTADO 1: O UPLOAD
          <div className={styles.uploadContainer}>
            <div className={styles.headerClean}>
              <h1 className={styles.title}>Transforme seu Material em Prática Ativa</h1>
              <p className={styles.subtitle}>
                Envie aquele PDF denso ou resumo e deixe a IA extrair o suprassumo em segundos.
              </p>
            </div>

            <div className={styles.dropzone}>
              <div className={styles.dropzoneInner}>
                <UploadCloud width={48} height={48} className={styles.dropIcon} />
                <h3>Arraste seu PDF ou cole o texto aqui</h3>
                <p>Tamanho máximo: 10MB</p>
                <button className={styles.browseBtn}>Procurar Arquivo</button>
              </div>
            </div>

            <div className={styles.actionBlock}>
              <button className={styles.primaryBtn} onClick={handleProcess}>
                Destrinchar Material
              </button>
            </div>
          </div>
        ) : (
          // ESTADO 2: O LABORATÓRIO
          <div className={styles.labContainer}>
            <div className={styles.labHeader}>
              <button className={styles.backBtn} onClick={handleReset}>
                <ArrowLeft width={18} height={18} /> Novo Material
              </button>
              <h2>Laboratório de Estudo</h2>
              <p className={styles.fileLabel}>📄 arquivo_estudo_constitucional.pdf</p>
            </div>

            <div className={styles.labLayout}>
              <aside className={styles.labSidebar}>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'simulado' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('simulado')}
                >
                  <span className={styles.tabIcon}>📝</span> Simulado Rápido
                </button>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'flashcards' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('flashcards')}
                >
                  <span className={styles.tabIcon}>🃏</span> Flashcards
                </button>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('chat')}
                >
                  <span className={styles.tabIcon}>💬</span> Modo Interrogatório (Chat)
                </button>
              </aside>

              <section className={styles.labContentArea}>
                {!activeTab ? (
                  <div className={styles.placeholderState}>
                    <Layers width={48} height={48} className={styles.placeholderIcon} />
                    <h3>Seu material foi processado!</h3>
                    <p>Selecione uma ferramenta no menu lateral para começar a estudar este material de forma ativa.</p>
                  </div>
                ) : (
                  <div className={styles.activeToolState}>
                    {activeTab === 'simulado' && <QuizTool />}
                    {activeTab === 'flashcards' && <FlashcardsTool />}
                    {activeTab === 'chat' && <h3>Módulo de Interrogatório em construção...</h3>}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
