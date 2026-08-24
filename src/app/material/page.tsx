"use client";

import { useState, useRef } from "react";
import styles from "./Material.module.css";
import Header from "@/components/Header/Header";
import { UploadCloud, Layers, ArrowLeft } from "lucide-react";
import QuizTool from "./QuizTool";
import FlashcardsTool from "./FlashcardsTool";
import { Aivur } from "@/components/Aivur/Aivur";

export default function MaterialPage() {
  const [isProcessed, setIsProcessed] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const [isDragActive, setIsDragActive] = useState(false);
  const [aivurState, setAivurState] = useState("calm");
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragActive) {
      setIsDragActive(true);
      setAivurState("curious");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    setAivurState("calm");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    simulateProcessing();
  };

  const simulateProcessing = () => {
    setAivurState("loading");
    setTimeout(() => {
      setAivurState("success");
      setTimeout(() => {
        setIsProcessed(true);
      }, 1000);
    }, 1500);
  };

  const handleReset = () => {
    setIsProcessed(false);
    setActiveTab(null);
    setAivurState("calm");
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        {!isProcessed ? (
          // ESTADO 1: O UPLOAD
          <div className={styles.uploadContainer} style={{ marginTop: "4rem" }}>
            <div className={styles.headerClean}>
              <h1 className={styles.title}>Cofre Editorial</h1>
              <p className={styles.subtitle}>
                Envie aquele PDF denso ou resumo e deixe a IA extrair o suprassumo em segundos.
              </p>
            </div>

            <div 
              ref={dropzoneRef}
              className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div style={{ position: "absolute", top: "-80px", left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }}>
                <Aivur size={140} state={aivurState} themeMode="dark" />
              </div>
              
              <div className={styles.dropzoneInner} style={{ paddingTop: "2rem" }}>
                <UploadCloud width={48} height={48} className={styles.dropIcon} />
                <h3>Arraste seu PDF ou cole o texto aqui</h3>
                <p>Tamanho máximo: 10MB</p>
                <button className={styles.browseBtn} onClick={(e) => { e.stopPropagation(); document.getElementById('file-upload')?.click(); }}>Procurar Arquivo</button>
                <input type="file" id="file-upload" style={{ display: 'none' }} onChange={(e) => { if(e.target.files?.length) simulateProcessing(); }} />
              </div>
            </div>

            <div className={styles.actionBlock}>
              <button className={styles.primaryBtn} onClick={simulateProcessing}>
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
