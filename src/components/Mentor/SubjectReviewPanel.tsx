import React, { useState } from "react";
import styles from "./Mentor.module.css";
import type { SubjectProgress, QuestaoReviewItem, FlashcardReviewItem } from "@/hooks/useCourseProgress";
import { motion, AnimatePresence } from "framer-motion";

interface SubjectReviewPanelProps {
  subject: string;
  state: SubjectProgress;
  onBack: () => void;
  onRemoveQuestao: (id: string) => void;
  onRemoveFlashcard: (id: string) => void;
}

export function SubjectReviewPanel({ subject, state, onBack, onRemoveQuestao, onRemoveFlashcard }: SubjectReviewPanelProps) {
  const questoes = Object.values(state?.reviewQuestoes || {});
  const flashcards = Object.values(state?.reviewFlashcards || {});

  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  const handleAnswerQuestao = (item: QuestaoReviewItem, alternativa: string) => {
    setRespostas(prev => ({ ...prev, [item.id]: alternativa }));
    const isCorreta = alternativa === item.data.correta;
    
    // Se acertar, remove da revisão após um breve delay visual
    if (isCorreta) {
      setTimeout(() => {
        onRemoveQuestao(item.id);
      }, 1500);
    }
  };

  const handleMarkFlashcard = (item: FlashcardReviewItem, status: "sei" | "nao_sei") => {
    if (status === "sei") {
      onRemoveFlashcard(item.id);
    } else {
      // Volta pro front se ele não sabe
      setFlipped(prev => ({ ...prev, [item.id]: false }));
    }
  };

  return (
    <div className={styles.reviewPanel}>
      <div className={styles.reviewHeader}>
        <button className={styles.reviewBackBtn} onClick={onBack}>
          ← Voltar para Tópicos
        </button>
        <h3 className={styles.reviewTitle}>Revisão: {subject}</h3>
        <p className={styles.reviewSubtitle}>
          Revise as questões que você errou e os flashcards que marcou como "Não Sei". 
          Ao acertar/saber, eles sairão desta lista.
        </p>
      </div>

      {questoes.length === 0 && flashcards.length === 0 && (
        <div className={styles.reviewEmpty}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>🎉</div>
          <strong>Parabéns!</strong>
          <p>Você não tem itens pendentes de revisão nesta matéria.</p>
        </div>
      )}

      {questoes.length > 0 && (
        <div className={styles.reviewSection}>
          <h4 className={styles.reviewSectionTitle}>Questões a Revisar ({questoes.length})</h4>
          <AnimatePresence>
          {questoes.map(item => {
            const q = item.data;
            const resp = respostas[q.id];
            const isCorreta = resp === q.correta;

            return (
              <motion.div 
                key={item.id} 
                className={styles.questaoCard}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, height: 0, padding: 0, margin: 0, overflow: "hidden", transition: { duration: 0.3 } }}
              >
                <div style={{ fontSize: "11px", color: "var(--color-primary)", fontWeight: "bold", marginBottom: "8px", textTransform: "uppercase" }}>
                  Tópico: {item.topicLabel}
                </div>
                <div className={styles.enunciado}>{q.enunciado}</div>
                <div className={styles.alternativas}>
                  {Object.entries(q.alternativas).map(([letra, texto]) => {
                    let classe = styles.alternativa;
                    if (resp) {
                      if (letra === q.correta) classe += ` ${styles.alternativaCorreta}`;
                      else if (letra === resp) classe += ` ${styles.alternativaIncorreta}`;
                    }

                    return (
                      <button 
                        key={letra} 
                        className={classe}
                        disabled={!!resp}
                        onClick={() => handleAnswerQuestao(item, letra)}
                      >
                        <strong>{letra})</strong> {texto}
                      </button>
                    );
                  })}
                </div>
                {resp && (
                  <div className={styles.justificativa}>
                    <strong>{isCorreta ? "✅ Correto! Removido da revisão." : "❌ Incorreto. Tente novamente depois."}</strong> {q.justificativa}
                  </div>
                )}
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}

      {flashcards.length > 0 && (
        <div className={styles.reviewSection}>
          <h4 className={styles.reviewSectionTitle}>Flashcards a Revisar ({flashcards.length})</h4>
          <div className={styles.flashcardList}>
            <AnimatePresence>
            {flashcards.map(item => {
              const fc = item.data;
              const isFlipped = !!flipped[fc.id];

              return (
                <motion.div 
                  key={item.id} 
                  className={styles.flashcard} 
                  onClick={() => setFlipped(p => ({ ...p, [fc.id]: !isFlipped }))}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, height: 0, padding: 0, margin: 0, overflow: "hidden", transition: { duration: 0.3 } }}
                >
                  <div style={{ fontSize: "11px", color: "var(--color-primary)", fontWeight: "bold", marginBottom: "8px", textTransform: "uppercase", width: "100%", textAlign: "left" }}>
                    Tópico: {item.topicLabel}
                  </div>
                  <div className={styles.flashcardFront}>{fc.front}</div>
                  {isFlipped && (
                    <>
                      <div className={styles.flashcardBack}>{fc.back}</div>
                      <div className={styles.flashcardActions} onClick={(e) => e.stopPropagation()}>
                        <button 
                          className={`${styles.flashcardBtn} ${styles.btnNaoSei}`}
                          onClick={() => handleMarkFlashcard(item, "nao_sei")}
                        >
                          Ainda não sei
                        </button>
                        <button 
                          className={`${styles.flashcardBtn} ${styles.btnSei}`}
                          onClick={() => handleMarkFlashcard(item, "sei")}
                        >
                          Agora eu sei!
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
