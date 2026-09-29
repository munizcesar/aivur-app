"use client";

import { useState } from "react";
import styles from "./FlashcardsTool.module.css";
import { RotateCcw } from "lucide-react";

// Mock data
const mockFlashcards = [
  {
    id: 1,
    front: "O que é Habeas Corpus?",
    back: "É um remédio constitucional (Art. 5º, LXVIII) destinado a proteger a liberdade de locomoção (ir, vir e permanecer) contra prisões ou restrições ilegais ou abusivas."
  },
  {
    id: 2,
    front: "Quais são os fundamentos da República Federativa do Brasil? (SOCI DIVAPLU)",
    back: "SOberania, CIdadania, DIgnidade da pessoa humana, VAlores sociais do trabalho e da livre iniciativa, PLUralismo político. (Art. 1º da CF/88)"
  },
  {
    id: 3,
    front: "O Mandado de Injunção serve para quê?",
    back: "Serve para viabilizar o exercício de um direito constitucionalmente previsto que está inviabilizado pela falta de uma norma regulamentadora (omissão legislativa)."
  }
];

export default function FlashcardsTool() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const currentCard = mockFlashcards[currentIndex];

  const handleFlip = () => {
    if (swipeDirection) return; // prevent clicking while swiping
    setIsFlipped(!isFlipped);
  };

  const handleDecision = (direction: 'left' | 'right') => {
    if (swipeDirection) return; // double click prevention
    setSwipeDirection(direction);

    // Wait for the swipe out animation to finish before loading the next card
    setTimeout(() => {
      if (currentIndex < mockFlashcards.length - 1) {
        setIsFlipped(false);
        setSwipeDirection(null);
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 300); // matches the CSS transition time
  };

  const handleRestart = () => {
    setIsFinished(false);
    setIsFlipped(false);
    setSwipeDirection(null);
    setCurrentIndex(0);
  };

  if (isFinished) {
    return (
      <div className={styles.finishedState}>
        <h2>Sessão Concluída! 🎉</h2>
        <p>Você revisou todos os flashcards deste bloco.</p>
        <button className={styles.restartBtn} onClick={handleRestart}>
          <RotateCcw width={18} height={18} /> Revisar Novamente
        </button>
      </div>
    );
  }

  // Determine classes for swipe animation
  let cardSwipeClass = "";
  if (swipeDirection === 'left') cardSwipeClass = styles.swipeLeft;
  if (swipeDirection === 'right') cardSwipeClass = styles.swipeRight;

  return (
    <div className={styles.toolContainer}>
      <header className={styles.header}>
        <span className={styles.counter}>
          Cartão {currentIndex + 1} de {mockFlashcards.length}
        </span>
      </header>

      <div className={styles.scene}>
        <div 
          className={`${styles.card} ${isFlipped ? styles.isFlipped : ""} ${cardSwipeClass}`} 
          onClick={!isFlipped ? handleFlip : undefined}
        >
          {/* FRENTE */}
          <div className={`${styles.cardFace} ${styles.cardFront}`}>
            <div className={styles.cardContent}>
              <h3 className={styles.frontText}>{currentCard.front}</h3>
            </div>
            <div className={styles.flipHint}>
              Clique no cartão para virar
            </div>
          </div>

          {/* VERSO */}
          <div className={`${styles.cardFace} ${styles.cardBack}`}>
            <div className={styles.cardContent}>
              <h3 className={styles.backTitle}>Resposta:</h3>
              <p className={styles.backText}>{currentCard.back}</p>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÕES DE DECISÃO (Aparecem só no verso) */}
      <div className={`${styles.decisionArea} ${isFlipped && !swipeDirection ? styles.showDecisions : ""}`}>
        <div className={styles.binaryButtons}>
          <button 
            className={`${styles.decisionBtn} ${styles.btnGhostRed}`}
            onClick={() => handleDecision('left')}
          >
            ❌ Errei
          </button>
          <button 
            className={`${styles.decisionBtn} ${styles.btnSolidGreen}`}
            onClick={() => handleDecision('right')}
          >
            ✅ Acertei
          </button>
        </div>
      </div>
    </div>
  );
}
