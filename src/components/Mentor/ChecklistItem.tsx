"use client";

import { memo, useState, useEffect, useRef } from "react";
import type { CourseTopic } from "@/types/course";
import styles from "./Mentor.module.css";
import { TopicDetails } from "./TopicDetails";
import { getTopicCounts } from "@/hooks/useTopicContent";
import { useCourseContext } from "@/context/CourseContext";
import { HelpCircle, Layers, PlayCircle } from "lucide-react";

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
          <button
            className={`${styles.actionBtn} ${styles.btnQuestoes}`}
            onClick={() => handleOpenTab("questoes")}
          >
            <HelpCircle width={16} height={16} />
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
            <Layers width={16} height={16} />
            <div className={styles.btnTextStack}>
              <span className={`${styles.btnCount} ${counts === null ? styles.skeleton : ""}`}>
                {counts === null ? "(00)" : counts.flashcards > 0 ? `(${counts.flashcards})` : ""}
              </span>
              <span className={styles.btnLabel}>
                {counts === null ? "Flashcards" : counts.flashcards > 0 ? "Flashcards" : "Gerar Flashcards"}
              </span>
            </div>
          </button>

          <a
            className={`${styles.actionBtn} ${styles.btnYouTube}`}
            href={ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Buscar "${topic.label}" no YouTube`}
            tabIndex={-1}
          >
            <PlayCircle width={16} height={16} />
            <span>YouTube</span>
          </a>
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
