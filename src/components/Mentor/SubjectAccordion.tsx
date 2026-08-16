"use client";

import { useRef, useEffect, useState } from "react";
import type { CourseSubject } from "@/types/course";
import ChecklistItem from "./ChecklistItem";
import styles from "./Mentor.module.css";
import { useCourseProgress } from "@/hooks/useCourseProgress";
import { SubjectReviewPanel } from "./SubjectReviewPanel";
import { useCourseContext } from "@/context/CourseContext";

interface SubjectAccordionProps {
  subject: CourseSubject;
  checked: Set<string>;
  onToggle: (id: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onEnterReview: () => void;
  isEditing?: boolean;
  onUpdateSubject?: (subject: CourseSubject | null) => void;
}

export default function SubjectAccordion({
  subject,
  checked,
  onToggle,
  isOpen,
  onToggleOpen,
  onEnterReview,
  isEditing,
  onUpdateSubject,
}: SubjectAccordionProps) {
  const { courseId } = useCourseContext();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<"topics" | "review">("topics");

  const { getSubjectMetrics, removeReviewQuestao, removeReviewFlashcard, state } = useCourseProgress(courseId);
  const metrics = getSubjectMetrics(subject.subject);

  const totalItems = subject.nichos.reduce((acc, n) => acc + n.items.length, 0);
  const doneItems = subject.nichos.reduce(
    (acc, n) => acc + n.items.filter((t) => checked.has(t.id)).length,
    0
  );

  const ytSubjectUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    subject.subject + " " + subject.ytTerm
  )}`;

  // Anima max-height para transição suave sem JS calculado no render
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (isOpen) {
      el.style.maxHeight = el.scrollHeight + "px";
    } else {
      el.style.maxHeight = "0px";
      // Opcional: resetar view ao fechar
      // if (activeView === "review") setActiveView("topics");
    }
  }, [isOpen, checked, activeView, state]); // recalcula quando conteúdo muda

  const handleEnterReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveView("review");
    onEnterReview();
  };

  const handleBackToTopics = () => {
    setActiveView("topics");
  };

  return (
    <div className={styles.subjectCard}>
      <button
        className={styles.subjectHeader}
        onClick={(e) => {
          // Se clicou num botão dentro, não faz toggle
          if ((e.target as HTMLElement).closest('button:not(.' + styles.subjectHeader + ')')) return;
          onToggleOpen();
        }}
        aria-expanded={isOpen}
        aria-controls={`subject-body-${subject.subject}`}
        id={`subject-header-${subject.subject}`}
      >
        <div className={styles.subjectHeaderLeft}>
          <svg
            className={`${styles.subjectChevron} ${isOpen ? styles.subjectChevronOpen : ""}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
            <span className={styles.subjectName}>{subject.subject}</span>
            {metrics.totalAnswered > 0 && (
              <span style={{ fontSize: "10px", color: "var(--color-primary)", fontWeight: "bold" }}>
                Acertos: {metrics.pctAcerto}%
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {metrics.pendingReview > 0 && (
            <button 
              className={styles.revisarBtn}
              onClick={handleEnterReview}
            >
              Revisar ({metrics.pendingReview})
            </button>
          )}
          <span className={styles.subjectProgress}>
            {doneItems}/{totalItems}
          </span>
          {isEditing && (
            <button 
              className={styles.resetBtn} 
              style={{ background: "var(--color-danger, #d32f2f)", color: "white", padding: "4px 8px", fontSize: "11px", marginLeft: "8px" }}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("Excluir esta matéria e todos os seus tópicos?")) {
                  onUpdateSubject?.(null);
                }
              }}
            >
              Remover Matéria
            </button>
          )}
        </div>
      </button>

      <div
        ref={bodyRef}
        className={styles.subjectBody}
        style={{ maxHeight: 0 }}
        id={`subject-body-${subject.subject}`}
        role="region"
        aria-labelledby={`subject-header-${subject.subject}`}
      >
        <div className={styles.subjectBodyInner}>
          {activeView === "topics" ? (
            <>
              <a
                className={styles.ytSubjectBtn}
                href={ytSubjectUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Buscar ${subject.subject} no YouTube`}
              >
                ▶ Buscar "{subject.subject}" no YouTube
              </a>

              {subject.nichos.map((nicho, nIdx) => (
                <div key={nicho.title}>
                  <div className={styles.nichoTitle}>{nicho.title}</div>
                  {nicho.items.map((topic, tIdx) => (
                    <div key={topic.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <ChecklistItem
                          topic={topic}
                          isChecked={checked.has(topic.id)}
                          onToggle={onToggle}
                          ytTerm={subject.ytTerm}
                          subject={subject.subject}
                          nicho={nicho.title}
                        />
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Remover o tópico "${topic.label}"?`)) {
                              const newNichos = [...subject.nichos];
                              newNichos[nIdx] = { ...newNichos[nIdx], items: [...newNichos[nIdx].items] };
                              newNichos[nIdx].items.splice(tIdx, 1);
                              onUpdateSubject?.({ ...subject, nichos: newNichos });
                            }
                          }}
                          style={{ background: "transparent", color: "var(--color-danger, #d32f2f)", border: "none", cursor: "pointer", fontSize: "16px", padding: "4px 8px" }}
                          title="Remover Tópico"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              
              {isEditing && (
                <button
                  className={styles.resetBtn}
                  style={{ background: "var(--color-primary)", color: "white", width: "100%", marginTop: "1rem" }}
                  onClick={() => {
                    const name = window.prompt("Nome do novo tópico:");
                    if (name) {
                      const newNichos = [...subject.nichos];
                      // Adiciona a um nicho existente ou cria "Tópicos Adicionais"
                      let targetNichoIdx = newNichos.findIndex(n => n.title === "Tópicos Adicionais");
                      if (targetNichoIdx === -1) {
                        newNichos.push({ title: "Tópicos Adicionais", items: [] });
                        targetNichoIdx = newNichos.length - 1;
                      }
                      newNichos[targetNichoIdx] = { 
                        ...newNichos[targetNichoIdx], 
                        items: [...newNichos[targetNichoIdx].items, { id: `topic_custom_${Date.now()}`, label: name }] 
                      };
                      onUpdateSubject?.({ ...subject, nichos: newNichos });
                    }
                  }}
                >
                  + Adicionar Tópico
                </button>
              )}
            </>
          ) : (
            <SubjectReviewPanel 
              subject={subject.subject}
              state={state.subjects[subject.subject]}
              onBack={handleBackToTopics}
              onRemoveQuestao={(id) => removeReviewQuestao(subject.subject, id)}
              onRemoveFlashcard={(id) => removeReviewFlashcard(subject.subject, id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
