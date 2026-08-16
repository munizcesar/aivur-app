"use client";

import { memo, useState, useEffect, useRef } from "react";
import type { CourseTopic } from "@/types/course";
import styles from "./Mentor.module.css";
import { TopicDetails } from "./TopicDetails";
import { getTopicCounts } from "@/hooks/useTopicContent";
import { useCourseContext } from "@/context/CourseContext";

interface ChecklistItemProps {
  topic: CourseTopic;
  isChecked: boolean;
  onToggle: (id: string) => void;
  ytTerm: string;
  subject: string;
  nicho: string;
}

function ChecklistItem({ topic, isChecked, onToggle, ytTerm, subject, nicho }: ChecklistItemProps) {
  const { setActiveTab } = useCourseContext();
  const [isOpen, setIsOpen] = useState(false);
  
  const [counts, setCounts] = useState<{ questoes: number; flashcards: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && counts === null) {
          getTopicCounts(topic.id).then(setCounts);
          observer.disconnect();
        }
      },
      { rootMargin: "50px" }
    );
    
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, [topic.id, counts]);

  const handleOpenTab = (tab: "teoria" | "flashcards" | "questoes") => {
    setActiveTab(tab);
    setIsOpen(true);
  };

  const handleLabelClick = () => {
    if (!isOpen) {
      setActiveTab("teoria");
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    topic.label + " " + ytTerm
  )}`;

  return (
    <div className={styles.checklistItemContainer} ref={containerRef}>
      <div className={styles.checklistItem} id={`topic-${topic.id}`}>
        <button
          className={`${styles.checkbox} ${isChecked ? styles.checkboxChecked : ""}`}
          onClick={() => onToggle(topic.id)}
          aria-label={isChecked ? `Desmarcar: ${topic.label}` : `Marcar como estudado: ${topic.label}`}
          aria-checked={isChecked}
          role="checkbox"
        >
          <svg
            className={`${styles.checkIcon} ${isChecked ? styles.checkIconVisible : ""}`}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 8.5L6.5 12L13 4"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <span
          className={`${styles.itemLabel} ${isChecked ? styles.itemLabelChecked : ""}`}
          onClick={handleLabelClick}
        >
          {topic.label}
        </span>

        <div className={styles.actionButtonGroup}>
          <a
            className={`${styles.actionBtn} ${styles.btnYouTube}`}
            href={ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Buscar "${topic.label}" no YouTube`}
            tabIndex={-1}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
            <span>YouTube</span>
          </a>

          <button
            className={`${styles.actionBtn} ${styles.btnQuestoes}`}
            onClick={() => handleOpenTab("questoes")}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 2C6.48 2 2 5.91 2 10.74c0 2.82 1.54 5.3 3.91 6.9l-1.4 3.78c-.14.39.26.74.63.59l4.31-1.74c.82.17 1.67.27 2.55.27 5.52 0 10-3.91 10-8.74S17.52 2 12 2zm1 12h-2v-2h2v2zm0-3.5c-.32.9-1 1.5-1 1.5s-.68-.6-1-1.5c-.21-.59-.21-1.5.86-1.5s1.29-.62 1.29-1.25c0-.69-.56-1.25-1.25-1.25s-1.25.56-1.25 1.25h-2c0-1.79 1.46-3.25 3.25-3.25s3.25 1.46 3.25 3.25c0 1.22-.84 2.11-2.15 2.75z"/>
            </svg>
            <div className={styles.btnTextStack}>
              <span className={`${styles.btnCount} ${counts === null ? styles.skeleton : ""}`}>
                {counts === null ? "(00)" : counts.questoes > 0 ? `(${counts.questoes})` : ""}
              </span>
              <span className={styles.btnLabel}>
                {counts === null ? "Questões" : counts.questoes > 0 ? "Questões" : "Gerar Questões"}
              </span>
            </div>
          </button>

          <button
            className={`${styles.actionBtn} ${styles.btnFlashcards}`}
            onClick={() => handleOpenTab("flashcards")}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm16 14H5V5h14v14z"/>
              <path d="M7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z"/>
            </svg>
            <div className={styles.btnTextStack}>
              <span className={`${styles.btnCount} ${counts === null ? styles.skeleton : ""}`}>
                {counts === null ? "(00)" : counts.flashcards > 0 ? `(${counts.flashcards})` : ""}
              </span>
              <span className={styles.btnLabel}>
                {counts === null ? "Flashcards" : counts.flashcards > 0 ? "Flashcards" : "Gerar Flashcards"}
              </span>
            </div>
          </button>
        </div>
      </div>
      
      {isOpen && (
        <TopicDetails 
          topicId={topic.id} 
          topicLabel={topic.label} 
          subject={subject} 
          nicho={nicho}
        />
      )}
    </div>
  );
}

export default memo(ChecklistItem);
