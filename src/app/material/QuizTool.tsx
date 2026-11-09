"use client";

import { useState } from "react";
import styles from "./QuizTool.module.css";
import { CheckCircle2, XCircle, Lightbulb, RotateCcw, Sparkles, Loader2, AlertCircle } from "lucide-react";
import type { MaterialQuestion } from "@/lib/validations/material-ai";

export interface QuizToolProps {
  questoes: MaterialQuestion[];
  onGenerateMore?: (quantidade: number) => Promise<boolean>;
  isGeneratingMore?: boolean;
  generateMoreError?: string | null;
}

export default function QuizTool({
  questoes,
  onGenerateMore,
  isGeneratingMore = false,
  generateMoreError = null,
}: QuizToolProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedQtd, setSelectedQtd] = useState(3);

  const handleSelect = (idx: number) => {
    if (isConfirmed) return;
    setSelectedOptionIdx(idx);
  };

  const handleConfirm = () => {
    if (selectedOptionIdx === null || isConfirmed) return;
    const currentQ = questoes[currentIndex];
    if (!currentQ) return;
    setIsConfirmed(true);
    if (selectedOptionIdx === currentQ.corretaIdx) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questoes.length - 1) {
      setIsConfirmed(false);
      setSelectedOptionIdx(null);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOptionIdx(null);
    setIsConfirmed(false);
    setScore(0);
    setIsFinished(false);
  };

  const handleTriggerGenerateMore = async () => {
    if (!onGenerateMore || isGeneratingMore) return;
    const prevLength = questoes.length;
    const success = await onGenerateMore(selectedQtd);
    if (success) {
      if (isFinished) {
        setIsFinished(false);
        setCurrentIndex(prevLength);
        setSelectedOptionIdx(null);
        setIsConfirmed(false);
      }
    }
  };

  if (!questoes || questoes.length === 0) {
    return (
      <div className={styles.quizContainer}>
        <header className={styles.quizHeader}>
          <p style={{ color: "var(--color-slate-blue)", textAlign: "center", padding: "2rem" }}>
            Nenhuma questão disponível para este material.
          </p>
        </header>
        {onGenerateMore && (
          <div className={styles.moreQuestionsBar}>
            <span className={styles.moreQuestionsLabel}>Gerar questões com IA:</span>
            <div className={styles.moreQuestionsControls}>
              <div className={styles.qtdSelector} role="group" aria-label="Quantidade de questões">
                {[1, 3, 5].map((q) => (
                  <button
                    key={`empty-qtd-${q}`}
                    type="button"
                    className={`${styles.qtdBtn} ${selectedQtd === q ? styles.qtdBtnActive : ""}`}
                    onClick={() => setSelectedQtd(q)}
                    disabled={isGeneratingMore}
                  >
                    +{q}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={styles.generateMoreBtn}
                onClick={handleTriggerGenerateMore}
                disabled={isGeneratingMore}
              >
                {isGeneratingMore ? (
                  <>
                    <Loader2 size={16} className="animate-spin shrink-0 flex-none" />
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="shrink-0 flex-none" />
                    <span>Gerar +{selectedQtd}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        {generateMoreError && (
          <div className={styles.generateMoreError}>
            <AlertCircle size={14} className="shrink-0 flex-none" />
            <span>{generateMoreError}</span>
          </div>
        )}
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questoes.length) * 100);
    return (
      <div className={styles.quizContainer} style={{ textAlign: "center", padding: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-cream)", marginBottom: "0.5rem" }}>
          Simulado Concluído! 🎉
        </h2>
        <p style={{ color: "var(--color-slate-blue)", fontSize: "1.1rem", marginBottom: "1.5rem" }}>
          Você acertou <strong>{score}</strong> de <strong>{questoes.length}</strong> questões ({percentage}% de aproveitamento).
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          <button
            type="button"
            onClick={handleRestart}
            className={styles.confirmBtn}
            style={{ maxWidth: "260px", margin: "0", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            <RotateCcw size={18} className="shrink-0 flex-none" /> Refazer Simulado
          </button>
        </div>

        {onGenerateMore && (
          <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "left" }}>
            <div className={styles.moreQuestionsBar}>
              <span className={styles.moreQuestionsLabel}>Adicionar mais questões ao simulado:</span>
              <div className={styles.moreQuestionsControls}>
                <div className={styles.qtdSelector} role="group" aria-label="Quantidade de questões adicionais">
                  {[1, 3, 5].map((q) => (
                    <button
                      key={`finished-qtd-${q}`}
                      type="button"
                      className={`${styles.qtdBtn} ${selectedQtd === q ? styles.qtdBtnActive : ""}`}
                      onClick={() => setSelectedQtd(q)}
                      disabled={isGeneratingMore}
                    >
                      +{q}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.generateMoreBtn}
                  onClick={handleTriggerGenerateMore}
                  disabled={isGeneratingMore}
                >
                  {isGeneratingMore ? (
                    <>
                      <Loader2 size={16} className="animate-spin shrink-0 flex-none" />
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="shrink-0 flex-none" />
                      <span>Gerar +{selectedQtd}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {generateMoreError && (
              <div className={styles.generateMoreError}>
                <AlertCircle size={14} className="shrink-0 flex-none" />
                <span>{generateMoreError}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const question = questoes[currentIndex] || questoes[0];
  const letters = ["A", "B", "C", "D"];

  return (
    <div className={styles.quizContainer}>
      <header className={styles.quizHeader}>
        <span className={styles.progressCounter}>
          Questão {currentIndex + 1} de {questoes.length}
        </span>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${((currentIndex + 1) / questoes.length) * 100}%` }}
          />
        </div>
      </header>

      <div className={styles.questionBlock}>
        <h3 className={styles.questionText}>{question.enunciado}</h3>

        <div className={styles.optionsList}>
          {question.opcoes.map((optText, optIdx) => {
            const isSelected = selectedOptionIdx === optIdx;
            const isCorrect = optIdx === question.corretaIdx;
            const isWrongSelected = isConfirmed && isSelected && !isCorrect;
            const isSuccess = isConfirmed && isCorrect;

            let stateClass = "";
            if (isConfirmed) {
              if (isSuccess) stateClass = styles.optionCorrect;
              else if (isWrongSelected) stateClass = styles.optionWrong;
              else stateClass = styles.optionDimmed;
            } else if (isSelected) {
              stateClass = styles.optionSelected;
            }

            return (
              <button
                key={`${question.id}-opt-${optIdx}`}
                type="button"
                className={`${styles.optionCard} ${stateClass}`}
                onClick={() => handleSelect(optIdx)}
                disabled={isConfirmed}
              >
                <div className={styles.optionLetter}>{letters[optIdx] ?? optIdx + 1}</div>
                <div className={styles.optionText}>{optText}</div>
                {isConfirmed && isSuccess && <CheckCircle2 size={20} className={`shrink-0 flex-none ${styles.resultIconCorrect}`} />}
                {isConfirmed && isWrongSelected && <XCircle size={20} className={`shrink-0 flex-none ${styles.resultIconWrong}`} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.actionArea} style={{ marginTop: "1.5rem" }}>
        {!isConfirmed ? (
          <button
            type="button"
            className={styles.confirmBtn}
            disabled={selectedOptionIdx === null}
            onClick={handleConfirm}
          >
            Confirmar Resposta
          </button>
        ) : (
          <div className={styles.feedbackArea}>
            <div className={styles.mentorExplanation}>
              <div className={styles.mentorHeader}>
                <Lightbulb size={18} className="shrink-0 flex-none" />
                <strong>Justificativa Fundamentada</strong>
              </div>
              <p>{question.justificativa}</p>
              {question.trecho_referencia && (
                <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--color-slate-blue)", fontStyle: "italic", borderTop: "1px solid rgba(107, 153, 179, 0.2)", paddingTop: "0.5rem" }}>
                  <strong>Fonte no material:</strong> &ldquo;{question.trecho_referencia}&rdquo;
                </div>
              )}
            </div>

            <button
              type="button"
              className={styles.nextBtn}
              onClick={handleNext}
            >
              {currentIndex === questoes.length - 1 ? "Finalizar Simulado ➔" : "Próxima Questão ➔"}
            </button>
          </div>
        )}
      </div>

      {onGenerateMore && (
        <div style={{ marginTop: "1rem" }}>
          <div className={styles.moreQuestionsBar}>
            <span className={styles.moreQuestionsLabel}>Adicionar mais questões ao simulado:</span>
            <div className={styles.moreQuestionsControls}>
              <div className={styles.qtdSelector} role="group" aria-label="Quantidade de questões adicionais">
                {[1, 3, 5].map((q) => (
                  <button
                    key={`active-qtd-${q}`}
                    type="button"
                    className={`${styles.qtdBtn} ${selectedQtd === q ? styles.qtdBtnActive : ""}`}
                    onClick={() => setSelectedQtd(q)}
                    disabled={isGeneratingMore}
                  >
                    +{q}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={styles.generateMoreBtn}
                onClick={handleTriggerGenerateMore}
                disabled={isGeneratingMore}
              >
                {isGeneratingMore ? (
                  <>
                    <Loader2 size={16} className="animate-spin shrink-0 flex-none" />
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="shrink-0 flex-none" />
                    <span>Gerar +{selectedQtd}</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {generateMoreError && (
            <div className={styles.generateMoreError}>
              <AlertCircle size={14} className="shrink-0 flex-none" />
              <span>{generateMoreError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
