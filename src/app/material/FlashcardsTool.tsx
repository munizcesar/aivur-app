"use client";

import { useState } from "react";
import styles from "./FlashcardsTool.module.css";
import { RotateCcw } from "lucide-react";
import type { MaterialFlashcard } from "@/lib/validations/material-ai";

export interface FlashcardsToolProps {
  flashcards: MaterialFlashcard[];
}

export default function FlashcardsTool({ flashcards }: FlashcardsToolProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className={styles.toolContainer}>
        <div className={styles.header}>
          <p style={{ color: "var(--color-slate-blue)", padding: "2rem" }}>
            Nenhum flashcard disponível para este material.
          </p>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  const handleFlip = () => {
    if (swipeDirection) return;
    setIsFlipped(!isFlipped);
  };

  const handleDecision = (direction: "left" | "right") => {
    if (swipeDirection) return;
    setSwipeDirection(direction);

    setTimeout(() => {
      if (currentIndex < flashcards.length - 1) {
        setIsFlipped(false);
        setSwipeDirection(null);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 300);
  };

  const handleRestart = () => {
    setIsFinished(false);
    setIsFlipped(false);
    setSwipeDirection(null);
    setCurrentIndex(0);
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setSwipeDirection(null);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setSwipeDirection(null);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (isFinished) {
    return (
      <div className={styles.finishedState}>
        <h2>Revisão Concluída! 🎉</h2>
        <p>Você revisou todos os {flashcards.length} flashcards deste material.</p>
        <button type="button" className={styles.restartBtn} onClick={handleRestart}>
          <RotateCcw size={18} className="shrink-0 flex-none" /> Revisar Novamente
        </button>
      </div>
    );
  }

  let cardSwipeClass = "";
  if (swipeDirection === "left") cardSwipeClass = styles.swipeLeft;
  if (swipeDirection === "right") cardSwipeClass = styles.swipeRight;

  return (
    <div className={styles.toolContainer}>
      <header className={styles.header}>
        <span className={styles.counter}>
          Cartão {currentIndex + 1} de {flashcards.length}
        </span>
      </header>

      <div className={styles.scene}>
        <div
          className={`${styles.card} ${isFlipped ? styles.isFlipped : ""} ${cardSwipeClass}`}
          onClick={!isFlipped ? handleFlip : undefined}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleFlip();
            }
          }}
          aria-label={isFlipped ? "Verso do flashcard" : "Frente do flashcard"}
        >
          {/* FRENTE */}
          <div className={`${styles.cardFace} ${styles.cardFront}`}>
            <div className={styles.cardContent}>
              <h3 className={styles.frontText}>{currentCard.frente}</h3>
            </div>
            <div className={styles.flipHint}>Clique no cartão para virar</div>
          </div>

          {/* VERSO */}
          <div className={`${styles.cardFace} ${styles.cardBack}`}>
            <div className={styles.cardContent}>
              <h3 className={styles.backTitle}>Resposta:</h3>
              <p className={styles.backText}>{currentCard.verso}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLES DE NAVEGAÇÃO E AVALIAÇÃO */}
      <div className={`${styles.decisionArea} ${isFlipped && !swipeDirection ? styles.showDecisions : ""}`}>
        <div className={styles.binaryButtons}>
          <button
            type="button"
            className={`${styles.decisionBtn} ${styles.btnGhostRed}`}
            onClick={() => handleDecision("left")}
          >
            ❌ Preciso Revisar
          </button>
          <button
            type="button"
            className={`${styles.decisionBtn} ${styles.btnSolidGreen}`}
            onClick={() => handleDecision("right")}
          >
            ✅ Dominei
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{
            background: "transparent",
            border: "1px solid rgba(107, 153, 179, 0.3)",
            color: "var(--color-cream)",
            padding: "0.4rem 0.9rem",
            borderRadius: "6px",
            fontSize: "0.85rem",
            cursor: currentIndex === 0 ? "not-allowed" : "pointer",
            opacity: currentIndex === 0 ? 0.4 : 1,
          }}
        >
          ← Anterior
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          style={{
            background: "transparent",
            border: "1px solid rgba(107, 153, 179, 0.3)",
            color: "var(--color-cream)",
            padding: "0.4rem 0.9rem",
            borderRadius: "6px",
            fontSize: "0.85rem",
            cursor: currentIndex === flashcards.length - 1 ? "not-allowed" : "pointer",
            opacity: currentIndex === flashcards.length - 1 ? 0.4 : 1,
          }}
        >
          Próximo →
        </button>
      </div>
    </div>
  );
}
